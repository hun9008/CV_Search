package com.www.goodjob.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.CvFeedback;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.RecommendScore;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.RecommendScoreRepository;
import com.www.goodjob.repository.CvFeedbackRepository;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.util.ClaudeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendService {

    private final RestTemplate restTemplate;
    private final RecommendScoreRepository recommendScoreRepository;
    private final CvFeedbackRepository cvFeedbackRepository;
    private final ClaudeClient claudeClient;
    private final JobRepository jobRepository;

    private final RedisTemplate<String, String> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    /**
     * FastAPI 서버로 추천 점수 요청
     */
    public List<ScoredJobDto> requestRecommendation(Long userId, int topk) {
        String zsetKey = "recommendation:" + userId;
        String hashKey = "job_detail";

        Set<ZSetOperations.TypedTuple<String>> topKJobIds = redisTemplate.opsForZSet()
                .reverseRangeWithScores(zsetKey, 0, topk - 1);

        if (topKJobIds == null || topKJobIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "캐시된 추천 결과가 없습니다.");
        }

        try {
            List<ScoredJobDto> result = new ArrayList<>();
            for (ZSetOperations.TypedTuple<String> tuple : topKJobIds) {
                try {
                    String jobIdStr = tuple.getValue();
                    if (jobIdStr == null) continue;

                    String jobJson = (String) redisTemplate.opsForHash().get(hashKey, jobIdStr);
                    if (jobJson == null) continue;

                    ScoredJobDto dto = objectMapper.readValue(jobJson, ScoredJobDto.class);
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

    /**
     * 추천 점수 기반 피드백 생성 또는 기존 피드백 조회
     */
    public String getOrGenerateFeedback(Long recommendScoreId, CustomUserDetails userDetails) {
        User user = userDetails.getUser();

        // 1. 추천 점수 조회
        RecommendScore score = recommendScoreRepository.findById(recommendScoreId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "추천 점수가 존재하지 않습니다"));

        // 2. 유저 검증
        if (!score.getCv().getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다");
        }

        // 3. 기존 피드백 조회
        Optional<CvFeedback> existing = cvFeedbackRepository.findByRecommendScore_Id(recommendScoreId);
        if (existing.isPresent()) {
            return existing.get().getFeedback();
        }

        // 4. Claude 호출 → 피드백 생성
        String feedback = claudeClient.generateFeedback(
                score.getCv().getRawText(),
                score.getJob().getRawJobsText()
        );

        // 5. 저장
        CvFeedback newFeedback = CvFeedback.builder()
                .recommendScore(score) // ← score 자체를 저장하는 게 아니라, recommendScore 엔티티를 참조
                .feedback(feedback)
                .confirmed(false)
                .build();

        cvFeedbackRepository.save(newFeedback);
        return feedback;
    }

    public void cacheRecommendForUser(Long userId) {
        int totalJobCount = (int) jobRepository.count();

        String url = fastapiHost + "/recommend-jobs";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "u_id", userId,
                "top_k", totalJobCount
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
                            rec.get("cosine_score").asDouble(),
                            rec.get("bm25_score").asDouble()
                    );
                    result.add(scored);
                });
            }

            String zsetKey = "recommendation:" + userId;

            for (ScoredJobDto job : result) {
                String jobIdStr = job.getId().toString();

                // ZSET에 점수 저장
                redisTemplate.opsForZSet().add(zsetKey, jobIdStr, job.getScore());

                // HASH에 상세 정보 저장
                try {
                    String jobJson = objectMapper.writeValueAsString(job);
                    redisTemplate.opsForHash().put("job_detail", jobIdStr, jobJson);
                } catch (JsonProcessingException e) {
                    log.warn("JobDto 직렬화 실패: jobId=" + jobIdStr, e);
                }
            }

            redisTemplate.expire(zsetKey, Duration.ofHours(6));
            log.info("[Debug] 추천 점수 전체 캐싱 완료: userId=" + userId);

        } catch (Exception e) {
            log.error("[Debug] 추천 점수 캐싱 실패: userId=" + userId, e);
        }
    }
}
