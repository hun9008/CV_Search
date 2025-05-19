package com.www.goodjob.service;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.RecommendScoreRepository;
import com.www.goodjob.util.ClaudeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    @Transactional
    public String deleteCv(Long userId) {
        String url = fastapiHost + "/delete-cv?user_id=" + userId;

        Cv cv = cvRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("CV not found"));
        Long cvId = cv.getId();
        try {
            recommendScoreRepository.deleteByCvId(cvId);
            restTemplate.delete(url);
            return "CV " + userId + " deleted from Elasticsearch and deleted from RDB.";
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
        String summary = claudeClient.generateCvSummary(cvText);

        cv.setSummary(summary);
        cvRepository.save(cv);

        return summary;
    }
}
