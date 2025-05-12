package com.www.goodjob.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class CvService {

    private final RestTemplate restTemplate;

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    public String deleteCv(Long userId) {
        String url = fastapiHost + "/delete-cv?user_id=" + userId;

        try {
            restTemplate.delete(url);
            return "CV " + userId + " deleted from Elasticsearch and deleted from RDB.";
        } catch (Exception e) {
            throw new RuntimeException("FastAPI 요청 실패: " + e.getMessage(), e);
        }
    }
}
