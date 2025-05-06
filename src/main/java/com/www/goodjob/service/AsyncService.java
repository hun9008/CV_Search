package com.www.goodjob.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.Job;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    @Autowired
    private ObjectMapper objectMapper;

    @Async
    public void cacheRecommendForUser(Long userId) {

        long startTime = System.nanoTime();
        long responseTime;
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


            for (JsonNode rec : recommendedJobsNode) {
                String jobIdStr = rec.get("job_id").asText();
                double score = rec.get("score").asDouble();
                // ZSET에 점수 저장
                redisTemplate.opsForZSet().add(zsetKey, jobIdStr, score);

            }

            redisTemplate.expire(zsetKey, Duration.ofHours(6));
            log.info("[Debug] 추천 점수 전체 캐싱 완료: userId=" + userId);

        } catch (Exception e) {
            log.error("[Debug] 추천 점수 캐싱 실패: userId=" + userId, e);
        } finally {
            endTime = System.nanoTime();
            durationMs = (endTime - startTime) / 1_000_000;
            log.info("[Debug] 추천 캐싱 수행 시간: {}ms (userId={})", durationMs, userId);
        }
    }
}
