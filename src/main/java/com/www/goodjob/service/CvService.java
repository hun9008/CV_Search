package com.www.goodjob.service;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.RecommendScoreRepository;
import com.www.goodjob.util.ClaudeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class CvService {

    private final RestTemplate restTemplate;
    private final CvRepository cvRepository;
    private final RecommendScoreRepository recommendScoreRepository;
    private final ClaudeClient claudeClient;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    @Transactional
    public String deleteCv(Long userId) {
        String url = fastapiHost + "/delete-cv?user_id=" + userId;

        Cv cv = cvRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("CV not found"));
        Long cvId = cv.getId();
        try {
            long t1 = System.currentTimeMillis();

            recommendScoreRepository.deleteByCvId(cvId);
            long t2 = System.currentTimeMillis();

            cvRepository.delete(cv);
            long t3 = System.currentTimeMillis();

            restTemplate.delete(url);
            long t4 = System.currentTimeMillis();

            // Redis 캐시 삭제
            String zsetKey = "recommendation:" + userId;
            redisTemplate.delete(zsetKey);
            log.info("[CV 삭제] Redis 캐시 삭제 완료: key={}", zsetKey);

            log.info("[CV 삭제] recommendScoreRepository.deleteByCvId: {}ms", (t2 - t1));
            log.info("[CV 삭제] cvRepository.delete: {}ms", (t3 - t2));
            log.info("[CV 삭제] restTemplate.delete (FastAPI 호출): {}ms", (t4 - t3));
            log.info("[CV 삭제] 전체 삭제 소요 시간: {}ms (userId={})", (t4 - t1), userId);

            return "CV " + userId + " deleted from Elasticsearch, RDB, and Redis.";
        } catch (Exception e) {
            log.error("삭제 실패", e);
            throw new RuntimeException("FastAPI 요청 실패: " + e.getMessage(), e);
        }
    }

    public String summaryCv(Long userId) {
        Cv cv = cvRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("CV not found for userId: " + userId));

        if (cv.getSummary() != null && !cv.getSummary().isBlank()) {
            return cv.getSummary();
        }

        String cvText = cv.getRawText();

        if ("Ready".equalsIgnoreCase(cvText)) {
            throw new IllegalStateException("아직 CV가 처리중 입니다.");
        }

        String summary = claudeClient.generateCvSummary(cvText);

        cv.setSummary(summary);
        cvRepository.save(cv);

        return summary;
    }
}
