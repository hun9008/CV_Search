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
                Optional<Job> jobOpt = jobRepository.findByIdWithRegion(jobId);

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
