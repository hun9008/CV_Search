package com.www.goodjob.unit;

import com.www.goodjob.service.RecommendService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendServiceTest {

    @InjectMocks
    private RecommendService recommendService;

    @Mock
    private RestTemplate restTemplate;

    @BeforeEach
    void setup() {
        // fastapiHost 필드 값 수동으로 설정
        ReflectionTestUtils.setField(recommendService, "fastapiHost", "http://mock-fastapi.com");
    }

    @Test
    void requestRecommendation_shouldReturnResponseFromFastAPI() {
        Long mockUserId = 4L;
        int mockTopk = 5;

        String url = "http://mock-fastapi.com/recommend-jobs";
        String expectedResponse = "{\"recommended_jobs\": [{\"job_id\": 1, \"score\": 0.95}]}";

        Map<String, Object> body = Map.of("u_id", mockUserId, "top_k", mockTopk);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        when(restTemplate.postForEntity(eq(url), eq(requestEntity), eq(String.class)))
                .thenReturn(ResponseEntity.ok(expectedResponse));

        String actual = recommendService.requestRecommendation(mockUserId, mockTopk);

        assertThat(actual).isEqualTo(expectedResponse);
    }
}