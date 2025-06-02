package com.www.goodjob.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.CvFeedback;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.RecommendScore;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.*;
import com.www.goodjob.util.ClaudeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncService {

    private final RestTemplate restTemplate;
    private final JobRepository jobRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final CvRepository cvRepository;
    private final RecommendScoreRepository recommendScoreRepository;
    private final RecommendScoreJdbcRepository jdbcRepository;
    private final CvFeedbackRepository cvFeedbackRepository;

    private final ClaudeClient claudeClient;


    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    @Autowired
    private ObjectMapper objectMapper;

    @Async
    public void cacheRecommendForUser(Long cvId) {

        long startTime = System.nanoTime();
        long responseTime = 0;
        long endTime;
        long durationMs;
        int totalJobCount = (int) jobRepository.count();

        String url = fastapiHost + "/recommend-jobs";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "cv_id", cvId,
                "top_k", totalJobCount
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            String responseBody = response.getBody();

            responseTime = System.nanoTime();
            durationMs = (responseTime - startTime) / 1_000_000;
            log.info("[Debug] 추천 리스트 응답 시간: {}ms (cvId={})", durationMs, cvId);

            String zsetKey = "recommendation:" + cvId;

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode recommendedJobsNode = root.get("recommended_jobs");


            redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
                for (JsonNode rec : recommendedJobsNode) {
                    String jobIdStr = rec.get("job_id").asText();
                    double score = rec.get("score").asDouble();

                    connection.zAdd(
                            zsetKey.getBytes(StandardCharsets.UTF_8),
                            score,
                            jobIdStr.getBytes(StandardCharsets.UTF_8)
                    );
                }
                return null;
            });

            redisTemplate.expire(zsetKey, Duration.ofHours(6));
            log.info("[Debug] 추천 점수 전체 캐싱 완료: cvId=" + cvId);

        } catch (Exception e) {
            log.error("[Debug] 추천 점수 캐싱 실패: cvId=" + cvId, e);
        } finally {
            endTime = System.nanoTime();
            durationMs = (endTime - responseTime) / 1_000_000;
            log.info("[Debug] 추천 캐싱 수행 시간: {}ms (userId={})", durationMs, cvId);
        }
    }

    @Async
    @Transactional
    public void saveRecommendScores(Long cvId, List<ScoredJobDto> recommendations) {

        try {
            jdbcRepository.batchUpsert(cvId, recommendations);
            log.info("[Recommend] 추천 점수 일괄 저장 성공: cvId={}", cvId);
        } catch (Exception e) {
            log.error("[Recommend] 추천 점수 일괄 저장 실패: cvId={}, error={}", cvId, e.getMessage(), e);
            throw new RuntimeException("추천 점수 저장 실패", e);
        }
    }

    @Async
    @Transactional
    public void generateCvSummaryAsync(Long cvId) {
        try {
            Cv cv = cvRepository.findById(cvId)
                    .orElseThrow(() -> new RuntimeException("CV not found for id: " + cvId));

            if (cv.getSummary() != null && !cv.getSummary().isBlank()) {
                log.info("[CV Summary] 이미 요약이 존재함: cvId={}", cvId);
                return;
            }

            String cvText = cv.getRawText();

            if ("Ready".equalsIgnoreCase(cvText)) {
                log.warn("[CV Summary] 아직 CV 텍스트가 준비되지 않음: cvId={}", cvId);
                return;
            }

            String summary = claudeClient.generateCvSummary(cvText);
            cv.setSummary(summary);
            cvRepository.save(cv);
            log.info("[CV Summary] 요약 생성 및 저장 완료: cvId={}", cvId);

        } catch (Exception e) {
            log.error("[CV Summary] 요약 생성 실패: cvId={}, error={}", cvId, e.getMessage(), e);
        }
    }

    @Async
    @Transactional
    public void generateFeedbackAsync(Long cvId, Long jobId) {
        long totalStart = System.nanoTime();

        try {
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
                log.info("[Feedback] 기존 피드백 존재함 → 생성 생략 (cvId={}, jobId={})", cvId, jobId);
                return;
            }

            long startClaude = System.nanoTime();
            String feedback = claudeClient.generateFeedback(
                    score.getCv().getRawText(),
                    score.getJob().getRawJobsText()
            );
            long endClaude = System.nanoTime();
            log.info("[Feedback] Claude 피드백 생성 시간: {}ms", (endClaude - startClaude) / 1_000_000);

            long startSave = System.nanoTime();
            CvFeedback newFeedback = CvFeedback.builder()
                    .recommendScore(score)
                    .feedback(feedback)
                    .confirmed(false)
                    .build();
            cvFeedbackRepository.save(newFeedback);
            long endSave = System.nanoTime();
            log.info("[Feedback] 피드백 저장 시간: {}ms", (endSave - startSave) / 1_000_000);

        } catch (Exception e) {
            log.error("[Feedback] 피드백 생성 실패: cvId={}, jobId={}, error={}", cvId, jobId, e.getMessage(), e);
        } finally {
            long totalEnd = System.nanoTime();
            log.info("[Feedback] 전체 비동기 피드백 생성 수행 시간: {}ms (cvId={}, jobId={})", (totalEnd - totalStart) / 1_000_000, cvId, jobId);
        }
    }
}
