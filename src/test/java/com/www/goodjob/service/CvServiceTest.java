package com.www.goodjob.service;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.CvDto;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.RecommendScoreRepository;
import com.www.goodjob.util.ClaudeClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CvServiceTest {

    @InjectMocks
    private CvService cvService;

    @Mock
    private CvRepository cvRepository;

    @Mock
    private RecommendScoreRepository recommendScoreRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ClaudeClient claudeClient;

    @Mock
    private S3Service s3Service;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(cvService, "fastapiHost", "http://localhost:8000");
    }

    @Test
    void deleteCv_성공() {
        // given
        Long cvId = 10L;
        Cv mockCv = Cv.builder().id(cvId).fileName("cv_10.pdf").build();

        when(cvRepository.findById(cvId)).thenReturn(Optional.of(mockCv));

        // when
        String result = cvService.deleteCv(cvId);

        // then
        verify(recommendScoreRepository).deleteByCvId(cvId);
        verify(cvRepository).delete(mockCv);
        verify(restTemplate).delete("http://localhost:8000/delete-cv?cv_id=" + cvId);
        verify(redisTemplate).delete("recommendation:" + cvId);
        verify(s3Service).deleteFileName("cv_10.pdf");

        assertEquals("CV 10 deleted from Elasticsearch, RDB, and Redis.", result);
    }

    @Test
    void deleteCv_Cv없을때_예외발생() {
        // given
        Long cvId = 999L;
        when(cvRepository.findById(cvId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(RuntimeException.class, () -> cvService.deleteCv(cvId));
        verify(recommendScoreRepository, never()).deleteByCvId(any());
        verify(restTemplate, never()).delete(anyString());
    }

    @Test
    void deleteCv_FastApi요청실패시_예외발생() {
        // given
        Long cvId = 10L;
        Cv cv = Cv.builder().id(cvId).fileName("cv.pdf").build();

        when(cvRepository.findById(cvId)).thenReturn(Optional.of(cv));
        doThrow(new RuntimeException("FastAPI error")).when(restTemplate)
                .delete("http://localhost:8000/delete-cv?cv_id=" + cvId);

        // when & then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> cvService.deleteCv(cvId));
        assertTrue(exception.getMessage().contains("FastAPI 요청 실패"));
    }

    @Test
    void summaryCv_성공() {
        // given
        Long cvId = 10L;
        String rawText = "이력서 내용입니다.";
        Cv mockCv = Cv.builder().id(cvId).rawText(rawText).build();

        when(cvRepository.findById(cvId)).thenReturn(Optional.of(mockCv));
        when(claudeClient.generateCvSummary(rawText)).thenReturn("요약된 이력서");

        // when
        String result = cvService.summaryCv(cvId);

        // then
        assertEquals("요약된 이력서", result);
        verify(cvRepository).findById(cvId);
        verify(claudeClient).generateCvSummary(rawText);
    }

    @Test
    void summaryCv_Cv없을때_예외발생() {
        // given
        Long cvId = 999L;
        when(cvRepository.findById(cvId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(RuntimeException.class, () -> cvService.summaryCv(cvId));
    }

    @Test
    void getMyCvs_userHasCvs_returnsCvDtoList() {
        // given
        Long userId = 1L;
        User user = User.builder().id(userId).build();

        Cv cv1 = Cv.builder().id(1L).fileName("cv1.pdf").user(user).build();
        Cv cv2 = Cv.builder().id(2L).fileName("cv2.pdf").user(user).build();
        when(cvRepository.findAllByUserId(userId)).thenReturn(List.of(cv1, cv2));

        // when
        List<CvDto> result = cvService.getMyCvs(userId);

        // then
        assertEquals(2, result.size());
        assertEquals("cv1.pdf", result.get(0).getFileName());
        assertEquals("cv2.pdf", result.get(1).getFileName());
        assertEquals(userId, result.get(0).getUserId());
    }

    @Test
    void getMyCvs_userHasNoCvs_throwsException() {
        // given
        Long userId = 1L;
        when(cvRepository.findAllByUserId(userId)).thenReturn(Collections.emptyList());

        // expect
        assertThrows(NoSuchElementException.class, () -> cvService.getMyCvs(userId));
    }

    @Test
    void deleteAllCvsByUserId_allSuccess_returnsSuccessMessages() {
        // given
        Long userId = 1L;
        Cv cv1 = Cv.builder().id(10L).build();
        Cv cv2 = Cv.builder().id(20L).build();
        when(cvRepository.findAllByUserId(userId)).thenReturn(List.of(cv1, cv2));

        // 내부 메서드 deleteCv mock
        CvService spyService = Mockito.spy(cvService);
        doReturn("CV 10 deleted").when(spyService).deleteCv(10L);
        doReturn("CV 20 deleted").when(spyService).deleteCv(20L);

        // when
        List<String> result = spyService.deleteAllCvsByUserId(userId);

        // then
        assertEquals(List.of("CV 10 deleted", "CV 20 deleted"), result);
    }

    @Test
    void deleteAllCvsByUserId_someFailures_returnsMixedResults() {
        // given
        Long userId = 1L;
        Cv cv1 = Cv.builder().id(10L).build();
        Cv cv2 = Cv.builder().id(20L).build();
        when(cvRepository.findAllByUserId(userId)).thenReturn(List.of(cv1, cv2));

        CvService spyService = Mockito.spy(cvService);
        doReturn("CV 10 deleted").when(spyService).deleteCv(10L);
        doThrow(new RuntimeException("삭제 실패")).when(spyService).deleteCv(20L);

        // when
        List<String> result = spyService.deleteAllCvsByUserId(userId);

        // then
        assertEquals(2, result.size());
        assertTrue(result.get(0).contains("CV 10 deleted"));
        assertTrue(result.get(1).contains("삭제 실패"));
    }

    @Test
    void deleteAllCvsByUserId_noCvs_throwsException() {
        // given
        Long userId = 1L;
        when(cvRepository.findAllByUserId(userId)).thenReturn(Collections.emptyList());

        // expect
        assertThrows(NoSuchElementException.class, () -> cvService.deleteAllCvsByUserId(userId));
    }
}