package com.www.goodjob.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.Cv;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.RecommendScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AsyncServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private CvRepository cvRepository;

    @Mock
    private RecommendScoreRepository recommendScoreRepository;

    @InjectMocks
    private AsyncService asyncService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(asyncService, "fastapiHost", "http://localhost:8000");
        ReflectionTestUtils.setField(asyncService, "objectMapper", objectMapper);
    }


    @Test
    void cacheRecommendForUser_worksAsExpected() throws Exception {
        // given
        Long userId = 1L;
        when(jobRepository.count()).thenReturn(2L);

        String json = """
            {
              "recommended_jobs": [
                { "job_id": 101, "score": 0.95 },
                { "job_id": 102, "score": 0.85 }
              ]
            }
            """;

        ResponseEntity<String> fakeResponse = new ResponseEntity<>(json, HttpStatus.OK);
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(fakeResponse);

        when(redisTemplate.executePipelined(any(RedisCallback.class))).thenReturn(null);

        // when
        asyncService.cacheRecommendForUser(userId);

        // then: 약간의 대기 (실제로는 바로 동작하지만, 비동기 보장 위해 약간의 여유 줌)
        Thread.sleep(100); // 이 테스트에선 비동기 처리 안 되므로 바로 실행됨

        verify(jobRepository).count();
        verify(restTemplate).postForEntity(anyString(), any(), eq(String.class));
        verify(redisTemplate).executePipelined(any(RedisCallback.class));
        verify(redisTemplate).expire(eq("recommendation:" + userId), eq(Duration.ofHours(6)));
    }


    @Test
    void saveRecommendScores_savesAllScoresSuccessfully() {
        // given
        Long userId = 1L;
        Long cvId = 100L;
        Cv mockCv = Cv.builder().id(cvId).build();

        List<ScoredJobDto> recommendations = List.of(
                ScoredJobDto.from(JobDto.builder().id(101L).build(), 0.95, 0.0, 0.0),
                ScoredJobDto.from(JobDto.builder().id(102L).build(), 0.87, 0.0, 0.0)
        );

        when(cvRepository.findByUserId(userId)).thenReturn(Optional.of(mockCv));

        // when
        asyncService.saveRecommendScores(userId, recommendations);

        // then
        verify(cvRepository).findByUserId(userId);
        verify(recommendScoreRepository).upsertScore(cvId, 101L, 0.95f);
        verify(recommendScoreRepository).upsertScore(cvId, 102L, 0.87f);
    }
}