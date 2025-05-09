package com.www.goodjob.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.Job;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.RecommendScoreRepository;
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

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    @Autowired
    private ObjectMapper objectMapper;

    @Async
    public void cacheRecommendForUser(Long userId) {

        long startTime = System.nanoTime();
        long responseTime = 0;
        long endTime;
        long durationMs;
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

            responseTime = System.nanoTime();
            durationMs = (responseTime - startTime) / 1_000_000;
            log.info("[Debug] 추천 리스트 응답 시간: {}ms (userId={})", durationMs, userId);

            String zsetKey = "recommendation:" + userId;

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
            log.info("[Debug] 추천 점수 전체 캐싱 완료: userId=" + userId);

        } catch (Exception e) {
            log.error("[Debug] 추천 점수 캐싱 실패: userId=" + userId, e);
        } finally {
            endTime = System.nanoTime();
            durationMs = (endTime - responseTime) / 1_000_000;
            log.info("[Debug] 추천 캐싱 수행 시간: {}ms (userId={})", durationMs, userId);
        }
    }

    @Async
    @Transactional
    public void saveRecommendScores(Long userId, List<ScoredJobDto> recommendations) {
        Cv cv = cvRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("[Error] CV not found for userId=" + userId));

        try {
            for (ScoredJobDto dto : recommendations) {
                recommendScoreRepository.upsertScore(cv.getId(), dto.getId(), (float) dto.getScore()); // user_id -> cv_id 사용
            }
            log.info("[Recommend] 추천 점수 저장 성공: userId={}", userId);
        } catch (Exception e) {
            log.error("[Recommend] 추천 점수 upsert 중 예외 발생: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("추천 점수 저장 실패", e);
        }
    }
}
