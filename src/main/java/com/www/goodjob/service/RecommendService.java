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
    private List<ScoredJobDto> fetchRecommendationFromFastAPI(Long cvId, int topk) {
        String url = fastapiHost + "/recommend-jobs";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "cv_id", cvId,
                "top_k", topk
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            String responseBody = response.getBody();

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode recommendedJobsNode = root.get("recommended_jobs");

            List<Long> jobIds = new ArrayList<>();
            Map<Long, Double> scoreMap = new HashMap<>();

            for (JsonNode rec : recommendedJobsNode) {
                Long jobId = rec.get("job_id").asLong();
                jobIds.add(jobId);
                scoreMap.put(jobId, rec.get("score").asDouble()); // 점수 저장
            }

            List<Job> jobs = jobRepository.findByIdInWithRegion(jobIds);

            Map<Long, Job> jobMap = jobs.stream()
                    .collect(Collectors.toMap(Job::getId, Function.identity()));

            List<ScoredJobDto> result = new ArrayList<>();

            for (Long jobId : jobIds) {
                Job job = jobMap.get(jobId);
                if (job != null) {
                    JobDto base = JobDto.from(job);
                    ScoredJobDto scored = ScoredJobDto.from(
                            base,
                            scoreMap.get(jobId),
                            0.0,
                            0.0
                    );
                    result.add(scored);
                }
            }

            return result;

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "추천 요청 실패", e);
        }
    }

    public List<ScoredJobDto> getScoredFromCache(Long cvId, int topk) {
        String zsetKey = "recommendation:" + cvId;

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

    public List<ScoredJobDto> requestRecommendation(Long cvId, int topk) {
        long startTime = System.nanoTime();
        long endTime;
        long durationMs;
        try {
            List<ScoredJobDto> cachedResult = getScoredFromCache(cvId, topk);
            log.info("[Recommend] 캐시된 추천 결과 사용: cvId={}, topK={}", cvId, topk);
            long saveStart = System.nanoTime();
            long saveEnd = 0;
            asyncService.saveRecommendScores(cvId, cachedResult);
            saveEnd = System.nanoTime();
            log.info("[Recommend] 스코어 저장 시간: {}ms (cvId={})", (saveEnd - saveStart) / 1_000_000, cvId);

            cachedResult.stream()
                    .limit(5)
                    .forEach(scoredJob -> asyncService.generateFeedbackAsync(cvId, scoredJob.getId()));

            return cachedResult;
        } catch (ResponseStatusException e) {
            if (e.getStatusCode() != HttpStatus.NOT_FOUND) {
                throw e; // 다른 에러면 그대로 throw
            }

            // 2. 캐시 없음 → 캐싱 비동기 실행
            log.info("[Recommend] 캐시 없음 → FastAPI 요청 후 캐시 비동기 처리 시작: cvId={}, topK={}", cvId, topk);
            asyncService.cacheRecommendForUser(cvId);

            List<ScoredJobDto> apiResult = fetchRecommendationFromFastAPI(cvId, topk);
            log.info("[Recommend] FastAPI 결과 반환 완료: userId={}, 추천 수={}", cvId, apiResult.size());
            long saveStart = System.nanoTime();
            long saveEnd = 0;
            asyncService.saveRecommendScores(cvId, apiResult);
            saveEnd = System.nanoTime();
            log.info("[Recommend] 스코어 저장 시간: {}ms (cvId={})", (saveEnd - saveStart) / 1_000_000, cvId);

            apiResult.stream()
                    .limit(3)
                    .forEach(scoredJob -> asyncService.generateFeedbackAsync(cvId, scoredJob.getId()));
            return apiResult;
        } finally {
            endTime = System.nanoTime();
            durationMs = (endTime - startTime) / 1_000_000;

            log.info("[Recommend] 전체 추천 수행 시간: {}ms (userId={})", durationMs, cvId);
        }
    }


    /**
     * 추천 점수 기반 피드백 무조건 새로 생성 (기존 피드백 덮어쓰기) -> 테스트용
     */
    public String getOrGenerateFeedback(Long cvId, Long jobId) {
        long totalStart = System.nanoTime();

        long startCvFetch = System.nanoTime();

        long endCvFetch = System.nanoTime();
        log.info("[Feedback] CV fetch 시간: {}ms", (endCvFetch - startCvFetch) / 1_000_000);

        long startScoreFetch = System.nanoTime();
        RecommendScore score = recommendScoreRepository.findByCvIdAndJobId(cvId, jobId);
        long endScoreFetch = System.nanoTime();
        log.info("[Feedback] RecommendScore fetch 시간: {}ms", (endScoreFetch - startScoreFetch) / 1_000_000);

        Long recommendScoreId = score.getId();

        long startFeedbackCheck = System.nanoTime();
        Optional<CvFeedback> existing = cvFeedbackRepository.findByRecommendScore_Id(recommendScoreId);
        long endFeedbackCheck = System.nanoTime();
        log.info("[Feedback] 피드백 존재 여부 확인 시간: {}ms", (endFeedbackCheck - startFeedbackCheck) / 1_000_000);

        if (existing.isPresent()) {
            log.info("[Feedback] 기존 피드백 반환 (cached)");
            return existing.get().getFeedback();
        }

        long startClaude = System.nanoTime();
        String feedback = claudeClient.generateFeedback(
                score.getCv().getRawText(),
                score.getJob().getRawJobsText()
        );
        long endClaude = System.nanoTime();
        log.info("[Feedback] Claude 피드백 생성 시간: {}ms", (endClaude - startClaude) / 1_000_000);

        long startDelete = System.nanoTime();
        cvFeedbackRepository.findByRecommendScore_Id(recommendScoreId)
                .ifPresent(cvFeedbackRepository::delete);
        long endDelete = System.nanoTime();
        log.info("[Feedback] 기존 피드백 삭제 시간: {}ms", (endDelete - startDelete) / 1_000_000);

        long startSave = System.nanoTime();
        CvFeedback newFeedback = CvFeedback.builder()
                .recommendScore(score)
                .feedback(feedback)
                .confirmed(false)
                .build();

        cvFeedbackRepository.save(newFeedback);
        long endSave = System.nanoTime();
        log.info("[Feedback] 새 피드백 저장 시간: {}ms", (endSave - startSave) / 1_000_000);

        long totalEnd = System.nanoTime();
        log.info("[Feedback] 전체 수행 시간: {}ms", (totalEnd - totalStart) / 1_000_000);

        return feedback;
    }

    public List<JobDto> fetchSimilarJobsFromFastAPI(Long jobId, int k) {
        String url = fastapiHost + "/similar-jobs?job_id=" + jobId + "&k=" + k;

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            String responseBody = response.getBody();

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode jobIdsNode = root.get("job_ids");

            List<Long> jobIds = new ArrayList<>();
            for (JsonNode idNode : jobIdsNode) {
                jobIds.add(idNode.asLong());
            }

            List<Job> jobs = jobRepository.findByIdInWithRegion(jobIds);
            Map<Long, Job> jobMap = jobs.stream()
                    .collect(Collectors.toMap(Job::getId, Function.identity()));

            List<JobDto> result = new ArrayList<>();
            for (Long id : jobIds) {
                Job job = jobMap.get(id);
                if (job != null) {
                    result.add(JobDto.from(job));
                }
            }

            return result;

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "유사 공고 요청 실패", e);
        }
    }

    public List<ScoredJobDto> testFetchRecommendationOnly(Long cvId, int topk) {
        return fetchRecommendationFromFastAPI(cvId, topk);
    }
}
