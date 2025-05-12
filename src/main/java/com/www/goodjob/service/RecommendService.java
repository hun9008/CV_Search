package com.www.goodjob.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.*;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.RecommendScoreRepository;
import com.www.goodjob.repository.CvFeedbackRepository;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.util.ClaudeClient;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendService {

    private final RestTemplate restTemplate;
    private final RecommendScoreRepository recommendScoreRepository;
    private final CvFeedbackRepository cvFeedbackRepository;
    private final ClaudeClient claudeClient;
    private final JobRepository jobRepository;
    private final CvRepository cvRepository;

    private final RedisTemplate<String, String> redisTemplate;

    private final AsyncService asyncService;

    private final EntityManager entityManager;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    /**
     * FastAPI 서버로 추천 점수 요청
     */
    private List<ScoredJobDto> fetchRecommendationFromFastAPI(Long userId, int topk) {
        String url = fastapiHost + "/recommend-jobs";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "u_id", userId,
                "top_k", topk
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            String responseBody = response.getBody();

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode recommendedJobsNode = root.get("recommended_jobs");

            List<ScoredJobDto> result = new ArrayList<>();

            for (JsonNode rec : recommendedJobsNode) {
                Long jobId = rec.get("job_id").asLong();

                Optional<Job> jobOpt = jobRepository.findById(jobId);

                jobOpt.ifPresent(job -> {
                    JobDto base = JobDto.from(job);
                    ScoredJobDto scored = ScoredJobDto.from(
                            base,
                            rec.get("score").asDouble(),
                            0.0,
                            0.0
                    );
                    result.add(scored);
                });
            }

            return result;

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "추천 요청 실패", e);
        }
    }

    public List<ScoredJobDto> getScoredFromCache(Long userId, int topk) {
        String zsetKey = "recommendation:" + userId;

        Set<ZSetOperations.TypedTuple<String>> topKJobIds = redisTemplate.opsForZSet()
                .reverseRangeWithScores(zsetKey, 0, topk - 1);

        if (topKJobIds == null || topKJobIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "캐시된 추천 결과가 없습니다.");
        }

        try {
            // jobId 수집
            List<Long> jobIds = topKJobIds.stream()
                    .map(ZSetOperations.TypedTuple::getValue)
                    .filter(Objects::nonNull)
                    .map(Long::parseLong)
                    .toList();

            // RDB에서 일괄 조회
            List<Job> jobs = jobRepository.findByIdInWithRegion(jobIds);

            // JobId → Job 매핑
            Map<Long, Job> jobMap = jobs.stream()
                    .collect(Collectors.toMap(Job::getId, Function.identity()));

            List<ScoredJobDto> result = new ArrayList<>();
            for (ZSetOperations.TypedTuple<String> tuple : topKJobIds) {
                try {
                    String jobIdStr = tuple.getValue();
                    if (jobIdStr == null) continue;

                    Long jobId = Long.parseLong(jobIdStr);
                    Job job = jobMap.get(jobId);
                    if (job == null) continue;

                    double score = Optional.ofNullable(tuple.getScore()).orElse(0.0);

                    JobDto base = JobDto.from(job);
                    ScoredJobDto dto = ScoredJobDto.from(
                            base,
                            score, // ZSet에서 꺼낸 score
                            0.0,
                            0.0
                    );
                    result.add(dto);
                } catch (Exception ex) {
                    log.warn("[WARN] 캐시된 job 변환 실패: {}", tuple.getValue(), ex);
                }
            }
            return result;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "추천 결과 조회 실패", e);
        }
    }

    public List<ScoredJobDto> requestRecommendation(Long userId, int topk) {
        long startTime = System.nanoTime();
        long endTime;
        long durationMs;
        try {
            List<ScoredJobDto> cachedResult = getScoredFromCache(userId, topk);
            log.info("[Recommend] 캐시된 추천 결과 사용: userId={}, topK={}", userId, topk);
            long saveStart = System.nanoTime();
            long saveEnd = 0;
            asyncService.saveRecommendScores(userId, cachedResult);
            saveEnd = System.nanoTime();
            log.info("[Recommend] 스코어 저장 시간: {}ms (userId={})", (saveEnd - saveStart) / 1_000_000, userId);
            return cachedResult;
        } catch (ResponseStatusException e) {
            if (e.getStatusCode() != HttpStatus.NOT_FOUND) {
                throw e; // 다른 에러면 그대로 throw
            }

            // 2. 캐시 없음 → 캐싱 비동기 실행
            log.info("[Recommend] 캐시 없음 → FastAPI 요청 후 캐시 비동기 처리 시작: userId={}, topK={}", userId, topk);
            asyncService.cacheRecommendForUser(userId);

            List<ScoredJobDto> apiResult = fetchRecommendationFromFastAPI(userId, topk);
            log.info("[Recommend] FastAPI 결과 반환 완료: userId={}, 추천 수={}", userId, apiResult.size());
            long saveStart = System.nanoTime();
            long saveEnd = 0;
            asyncService.saveRecommendScores(userId, apiResult);
            saveEnd = System.nanoTime();
            log.info("[Recommend] 스코어 저장 시간: {}ms (userId={})", (saveEnd - saveStart) / 1_000_000, userId);
            return apiResult;
        } finally {
            endTime = System.nanoTime();
            durationMs = (endTime - startTime) / 1_000_000;

            log.info("[Recommend] 전체 추천 수행 시간: {}ms (userId={})", durationMs, userId);
        }
    }


    /**
     * 추천 점수 기반 피드백 무조건 새로 생성 (기존 피드백 덮어쓰기) -> 테스트용
     */
    public String getOrGenerateFeedback(Long jobId, CustomUserDetails userDetails) {
        User user = userDetails.getUser();

        // 1. 추천 점수 조회
        RecommendScore score = recommendScoreRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "추천 점수가 존재하지 않습니다"));

        // 2. 유저 검증
        if (!score.getCv().getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다");
        }

        // 3. Claude 호출 → 피드백 생성
        String feedback = claudeClient.generateFeedback(
                score.getCv().getRawText(),
                score.getJob().getRawJobsText()
        );

        // 4. 기존 피드백 삭제 (있다면)
        cvFeedbackRepository.findByRecommendScore_Id(recommendScoreId)
                .ifPresent(cvFeedbackRepository::delete);

        // 5. 새 피드백 저장
        CvFeedback newFeedback = CvFeedback.builder()
                .recommendScore(score)
                .feedback(feedback)
                .confirmed(false)
                .build();

        cvFeedbackRepository.save(newFeedback);
        return feedback;
    }
}
