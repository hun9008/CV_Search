package com.www.goodjob.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.CvFeedback;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.RecommendScore;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.*;
import com.www.goodjob.util.ClaudeClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    private RecommendScoreJdbcRepository jdbcRepository;

    @Mock
    private CvRepository cvRepository;

    @Mock
    private CvFeedbackRepository cvFeedbackRepository;

    @Mock
    private RecommendScoreRepository recommendScoreRepository;

    @InjectMocks
    private AsyncService asyncService;

    @Mock private ClaudeClient claudeClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(asyncService, "fastapiHost", "http://localhost:8000");
        ReflectionTestUtils.setField(asyncService, "objectMapper", objectMapper);
    }

    private ClaudeClient mockClaudeClient(String summary, String feedback) {
        ClaudeClient mockClient = mock(ClaudeClient.class);
        when(mockClient.generateCvSummary(anyString())).thenReturn(summary);
        when(mockClient.generateFeedback(anyString(), anyString())).thenReturn(feedback);
        return mockClient;
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
    void saveRecommendScores_callsBatchUpsertWithCorrectArguments() {
        // given
        Long cvId = 100L;
        List<ScoredJobDto> recommendations = List.of(
                ScoredJobDto.from(JobDto.builder().id(101L).build(), 0.95, 0.0, 0.0),
                ScoredJobDto.from(JobDto.builder().id(102L).build(), 0.87, 0.0, 0.0)
        );

        // when
        asyncService.saveRecommendScores(cvId, recommendations);

        // then
        verify(jdbcRepository).batchUpsert(eq(cvId), eq(recommendations));
    }

    @Test
    void saveRecommendScores_logsErrorAndThrowsOnFailure() {
        // given
        Long cvId = 100L;
        List<ScoredJobDto> recommendations = List.of(
                ScoredJobDto.from(JobDto.builder().id(101L).build(), 0.95, 0.0, 0.0)
        );

        doThrow(new RuntimeException("DB error"))
                .when(jdbcRepository).batchUpsert(eq(cvId), any());

        // when & then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> asyncService.saveRecommendScores(cvId, recommendations));

        assertEquals("추천 점수 저장 실패", exception.getMessage());
        verify(jdbcRepository).batchUpsert(eq(cvId), eq(recommendations));
    }

    @Test
    void generateCvSummaryAsync_doesNothingIfSummaryAlreadyExists() {
        // given
        Long cvId = 123L;
        Cv cv = Cv.builder()
                .id(cvId)
                .rawText("Some text")
                .summary("이미 존재하는 요약")
                .build();

        when(cvRepository.findById(cvId)).thenReturn(Optional.of(cv));

        // when
        asyncService.generateCvSummaryAsync(cvId);

        // then
        verify(cvRepository, times(0)).save(any());
    }

    @Test
    void generateCvSummaryAsync_generatesAndSavesSummaryIfNotExists() {
        // given
        Long cvId = 123L;
        Cv cv = Cv.builder()
                .id(cvId)
                .rawText("Some CV text")
                .summary(null)
                .build();

        when(cvRepository.findById(cvId)).thenReturn(Optional.of(cv));

        ClaudeClient mockClient = mock(ClaudeClient.class);
        ReflectionTestUtils.setField(asyncService, "claudeClient", mockClient);
        when(mockClient.generateCvSummary("Some CV text")).thenReturn("요약 결과");

        // when
        asyncService.generateCvSummaryAsync(cvId);

        // then
        assertEquals("요약 결과", cv.getSummary());
        verify(cvRepository).save(cv);
    }

    @Test
    void generateCvSummaryAsync_logsErrorIfClaudeFails() {
        // given
        Long cvId = 999L;

        Cv cv = new Cv();
        cv.setId(cvId);
        cv.setRawText("some text");

        when(cvRepository.findById(cvId)).thenReturn(Optional.of(cv));
        ClaudeClient failingClient = mock(ClaudeClient.class);
        ReflectionTestUtils.setField(asyncService, "claudeClient", failingClient);
        when(failingClient.generateCvSummary(anyString())).thenThrow(new RuntimeException("Claude error"));

        // when
        asyncService.generateCvSummaryAsync(cvId);

        // then
        verify(cvRepository).findById(cvId);
    }

    @Test
    void generateFeedbackAsync_doesNothingIfFeedbackAlreadyExists() {
        // given
        Long cvId = 1L;
        Long jobId = 2L;

        Cv cv = new Cv();
        cv.setRawText("CV");

        Job job = new Job();
        job.setRawJobsText("JOB");

        RecommendScore score = new RecommendScore();
        score.setId(99L);
        score.setCv(cv);
        score.setJob(job);

        when(recommendScoreRepository.findByCvIdAndJobId(cvId, jobId)).thenReturn(score);
        when(cvFeedbackRepository.findByRecommendScore_Id(99L)).thenReturn(Optional.of(new CvFeedback()));

        // when
        asyncService.generateFeedbackAsync(cvId, jobId);

        // then
        verify(cvFeedbackRepository, never()).save(any());
    }

    @Test
    void generateFeedbackAsync_generatesAndSavesFeedback() {
        // given
        Long cvId = 1L;
        Long jobId = 2L;

        Cv cv = new Cv();
        cv.setRawText("CV TEXT");

        Job job = new Job();
        job.setRawJobsText("JOB TEXT");

        RecommendScore score = new RecommendScore();
        score.setId(77L);
        score.setCv(cv);
        score.setJob(job);

        when(recommendScoreRepository.findByCvIdAndJobId(cvId, jobId)).thenReturn(score);
        when(cvFeedbackRepository.findByRecommendScore_Id(77L)).thenReturn(Optional.empty());

        ClaudeClient mockClient = mock(ClaudeClient.class);
        ReflectionTestUtils.setField(asyncService, "claudeClient", mockClient);
        when(mockClient.generateFeedback("CV TEXT", "JOB TEXT")).thenReturn("좋은 피드백");

        // when
        asyncService.generateFeedbackAsync(cvId, jobId);

        // then
        verify(cvFeedbackRepository).save(argThat(saved ->
                saved.getFeedback().equals("좋은 피드백") &&
                        saved.getRecommendScore() == score &&
                        !saved.isConfirmed()
        ));
    }

    @Test
    void generateFeedbackAsync_logsErrorIfFeedbackFails() {
        Long cvId = 1L;
        Long jobId = 2L;

        RecommendScore score = new RecommendScore();
        Cv cv = new Cv(); cv.setRawText("CV");
        Job job = new Job(); job.setRawJobsText("JOB");

        score.setCv(cv);
        score.setJob(job);
        score.setId(10L);

        when(recommendScoreRepository.findByCvIdAndJobId(cvId, jobId)).thenReturn(score);
        when(cvFeedbackRepository.findByRecommendScore_Id(10L)).thenReturn(Optional.empty());

        ClaudeClient failingClient = mock(ClaudeClient.class);
        ReflectionTestUtils.setField(asyncService, "claudeClient", failingClient);
        when(failingClient.generateFeedback(anyString(), anyString())).thenThrow(new RuntimeException("Claude failure"));

        // when
        asyncService.generateFeedbackAsync(cvId, jobId);

        // then
        verify(cvFeedbackRepository, never()).save(any());
    }

    @Test
    void cacheRecommendForUser_zAddCalledWithCorrectJobIdsAndScores() throws Exception {
        // given
        Long cvId = 123L;
        when(jobRepository.count()).thenReturn(2L);

        String json = """
        {
          "recommended_jobs": [
            { "job_id": 1, "score": 0.9 },
            { "job_id": 2, "score": 0.8 }
          ]
        }
        """;
        ResponseEntity<String> response = new ResponseEntity<>(json, HttpStatus.OK);
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class))).thenReturn(response);

        // captor 생성
        ArgumentCaptor<RedisCallback> callbackCaptor = ArgumentCaptor.forClass(RedisCallback.class);
        when(redisTemplate.executePipelined(callbackCaptor.capture())).thenReturn(null);

        RedisConnection mockConnection = mock(RedisConnection.class);

        // when
        asyncService.cacheRecommendForUser(cvId);

        // captured callback 수동 실행
        RedisCallback<?> actualCallback = callbackCaptor.getValue();
        actualCallback.doInRedis(mockConnection);

        // then
        verify(mockConnection).zAdd(
                eq("recommendation:123".getBytes(StandardCharsets.UTF_8)),
                eq(0.9),
                eq("1".getBytes(StandardCharsets.UTF_8))
        );
        verify(mockConnection).zAdd(
                eq("recommendation:123".getBytes(StandardCharsets.UTF_8)),
                eq(0.8),
                eq("2".getBytes(StandardCharsets.UTF_8))
        );
    }

    @Test
    void cacheRecommendForUser_logsErrorOnMalformedJson() {
        Long cvId = 55L;
        when(jobRepository.count()).thenReturn(1L);

        String malformedJson = "{ invalid_json: }";
        ResponseEntity<String> response = new ResponseEntity<>(malformedJson, HttpStatus.OK);
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class))).thenReturn(response);

        // when
        asyncService.cacheRecommendForUser(cvId);

        // then
        verify(redisTemplate, never()).executePipelined(any(RedisCallback.class));
        verify(redisTemplate, never()).expire(any(), any());
    }

    @Test
    @DisplayName("CV 요약 생성 - rawText가 Ready면 ClaudeClient 호출 없이 종료됨")
    void generateCvSummaryAsync_readyStatus_shouldSkip() {
        // given
        Cv mockCv = new Cv();
        mockCv.setId(123L);
        mockCv.setRawText("Ready");

        when(cvRepository.findById(123L)).thenReturn(Optional.of(mockCv));

        // when
        asyncService.generateCvSummaryAsync(123L);

        // then
        verify(cvRepository, times(1)).findById(123L);
        verify(claudeClient, never()).generateCvSummary(any());
        verify(cvRepository, never()).save(any());
    }
}