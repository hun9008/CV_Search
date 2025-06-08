package com.www.goodjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.*;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.CvFeedbackRepository;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.RecommendScoreRepository;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.util.ClaudeClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.DefaultTypedTuple;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendServiceTest {

    @Spy
    @InjectMocks
    private RecommendService recommendService;

    @Mock
    private AsyncService asyncService;

    @Mock(lenient = true)
    private RedisTemplate<String, String> redisTemplate;

    @Mock(lenient = true)
    private ZSetOperations<String, String> zSetOperations;

    @Mock
    private RecommendScoreRepository recommendScoreRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CustomUserDetails userDetails;

    @Mock
    private CvRepository cvRepository;

    @Mock
    private CvFeedbackRepository cvFeedbackRepository;

    @Mock
    private ClaudeClient claudeClient;

    private ObjectMapper realObjectMapper = new ObjectMapper(); // 실제 인스턴스

    @BeforeEach
    void objectMapperSetup() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        when(zSetOperations.reverseRangeWithScores(any(), anyLong(), anyLong()))
                .thenReturn(null); // 캐시 미스 유도

        // 실제 인스턴스를 recommendService에 수동 주입
        ReflectionTestUtils.setField(recommendService, "objectMapper", realObjectMapper);
    }

    @Mock
    private RestTemplate restTemplate;

    @BeforeEach
    void setup() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        when(zSetOperations.reverseRangeWithScores(any(), anyLong(), anyLong()))
                .thenReturn(null); // 캐시 미스 유도
    }

    @Test
    void requestRecommendation_캐시존재_정상응답() {
        // given
        Long userId = 1L;
        int topk = 2;

        Set<ZSetOperations.TypedTuple<String>> cached = Set.of(
                new DefaultTypedTuple<>("1", 0.96),
                new DefaultTypedTuple<>("2", 0.83)
        );
        when(zSetOperations.reverseRangeWithScores(anyString(), anyLong(), anyLong()))
                .thenReturn(cached);

        Job dummyJob1 = new Job();
        dummyJob1.setId(1L);
        dummyJob1.setTitle("Job 1");
        dummyJob1.setFavicon(new Favicon(null, "some-domain", "base64string"));

        Job dummyJob2 = new Job();
        dummyJob2.setId(2L);
        dummyJob2.setTitle("Job 2");
        dummyJob2.setFavicon(new Favicon(null, "some-domain", "base64string"));


        when(jobRepository.findByIdInWithRegion(anyList()))
                .thenReturn(List.of(dummyJob1, dummyJob2));

        // when
        List<ScoredJobDto> result = recommendService.requestRecommendation(userId, topk);

        // then
        assertEquals(2, result.size());
        verify(asyncService).saveRecommendScores(eq(userId), anyList());
    }

    @Test
    void requestRecommendation_캐시없음_정상응답() throws Exception {
        // given
        Long userId = 2L;
        int topk = 1;

        // 캐시 없도록 설정
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                .when(recommendService).getScoredFromCache(userId, topk);

        // FastAPI 응답 가정
        String mockJson = """
        {
          "recommended_jobs": [
            {
              "job_id": 42,
              "score": 95.71
            }
          ]
        }
        """;

        ResponseEntity<String> mockResponse = ResponseEntity.ok(mockJson);
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(mockResponse);

//        JsonNode mockRoot = new ObjectMapper().readTree(mockJson);
//        when(objectMapper.readTree(mockJson)).thenReturn(mockRoot);

        Job mockJob = mock(Job.class);
        when(mockJob.getId()).thenReturn(42L);
        when(mockJob.getFavicon()).thenReturn(new Favicon(null, "some-domain", "base64string"));
        when(jobRepository.findByIdInWithRegion(anyList())).thenReturn(List.of(mockJob));

        // when
        List<ScoredJobDto> result = recommendService.requestRecommendation(userId, topk);

        // then
        assertEquals(1, result.size());
        verify(asyncService).cacheRecommendForUser(userId);
        verify(asyncService).saveRecommendScores(eq(userId), anyList());
    }

    @Test
    void requestRecommendation_캐시이외_예외발생() {
        // given
        Long userId = 3L;
        int topk = 5;

        // 캐시 조회 중 500 예외 발생
        doThrow(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR))
                .when(recommendService).getScoredFromCache(userId, topk);

        // when & then
        assertThrows(ResponseStatusException.class, () -> {
            recommendService.requestRecommendation(userId, topk);
        });

        verify(asyncService, never()).cacheRecommendForUser(any());
        verify(asyncService, never()).saveRecommendScores(any(), any());
    }


    @Test
    void getOrGenerateFeedback_returnsExistingFeedbackWhenPresent() {
        // given
        Long cvId = 1L;
        Long jobId = 2L;

        Cv cv = new Cv();
        cv.setRawText("CV_TEXT");

        Job job = new Job();
        job.setRawJobsText("JOB_TEXT");

        RecommendScore score = new RecommendScore();
        score.setId(100L);
        score.setCv(cv);
        score.setJob(job);

        CvFeedback existing = new CvFeedback();
        existing.setFeedback("기존 피드백");

        when(recommendScoreRepository.findByCvIdAndJobId(cvId, jobId)).thenReturn(score);
        when(cvFeedbackRepository.findByRecommendScore_Id(100L)).thenReturn(Optional.of(existing));

        // when
        String result = recommendService.getOrGenerateFeedback(cvId, jobId);

        // then
        assertEquals("기존 피드백", result);
        verify(claudeClient, never()).generateFeedback(any(), any());
        verify(cvFeedbackRepository, never()).save(any());
    }

    @Test
    void getOrGenerateFeedback_createsAndSavesNewFeedbackWhenNoneExists() {
        // given
        Long cvId = 1L;
        Long jobId = 2L;

        Cv cv = new Cv();
        cv.setRawText("CV_TEXT");

        Job job = new Job();
        job.setRawJobsText("JOB_TEXT");

        RecommendScore score = new RecommendScore();
        score.setId(200L);
        score.setCv(cv);
        score.setJob(job);

        when(recommendScoreRepository.findByCvIdAndJobId(cvId, jobId)).thenReturn(score);
        when(cvFeedbackRepository.findByRecommendScore_Id(200L)).thenReturn(Optional.empty());
        when(claudeClient.generateFeedback("CV_TEXT", "JOB_TEXT")).thenReturn("새 피드백");

        // when
        String result = recommendService.getOrGenerateFeedback(cvId, jobId);

        // then
        assertEquals("새 피드백", result);
        verify(claudeClient).generateFeedback("CV_TEXT", "JOB_TEXT");
        verify(cvFeedbackRepository).save(argThat(fb ->
                fb.getFeedback().equals("새 피드백") &&
                        fb.getRecommendScore() == score &&
                        !fb.isConfirmed()
        ));
    }

    @Test
    void getOrGenerateFeedback_returnsExistingFeedbackWithoutModifying() {
        // given
        Long cvId = 3L;
        Long jobId = 4L;

        Cv cv = new Cv(); cv.setRawText("RAW CV");
        Job job = new Job(); job.setRawJobsText("RAW JOB");

        RecommendScore score = new RecommendScore();
        score.setId(300L);
        score.setCv(cv);
        score.setJob(job);

        CvFeedback oldFeedback = new CvFeedback();
        oldFeedback.setFeedback("이전 피드백");

        when(recommendScoreRepository.findByCvIdAndJobId(cvId, jobId)).thenReturn(score);
        when(cvFeedbackRepository.findByRecommendScore_Id(300L)).thenReturn(Optional.of(oldFeedback));

        // when
        String result = recommendService.getOrGenerateFeedback(cvId, jobId);

        // then
        assertEquals("이전 피드백", result);
        verify(cvFeedbackRepository, never()).delete(any());
        verify(cvFeedbackRepository, never()).save(any());
        verify(claudeClient, never()).generateFeedback(any(), any());
    }

    @Test
    void cacheRecommendForUser() {
    }

}