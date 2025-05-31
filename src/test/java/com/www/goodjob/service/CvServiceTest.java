package com.www.goodjob.service;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.User;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.RecommendScoreRepository;
import com.www.goodjob.util.ClaudeClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

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
    private RedisTemplate<String, Object> redisTemplate;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(cvService, "fastapiHost", "http://localhost:8000");
    }

//    @Test
//    void deleteCv_성공() {
//        // given
//        Long userId = 1L;
//        Long cvId = 10L;
//
//        User mockUser = User.builder().id(userId).email("test@example.com").name("hun").build();
//        Cv mockCv = Cv.builder().id(cvId).user(mockUser).build();
//
//        when(cvRepository.findByUserId(userId)).thenReturn(Optional.of(mockCv));
//
//        // when
//        String result = cvService.deleteCv(userId);
//
//        // then
//        verify(cvRepository).findByUserId(userId);
//        verify(recommendScoreRepository).deleteByCvId(cvId);
//        verify(restTemplate).delete("http://localhost:8000/delete-cv?user_id=" + userId);
//        assertEquals("CV 1 deleted from Elasticsearch, RDB, and Redis.", result);
//    }

//    @Test
//    void deleteCv_Cv없을때_예외발생() {
//        // given
//        Long userId = 999L;
//        when(cvRepository.findByUserId(userId)).thenReturn(Optional.empty());
//
//        // when & then
//        assertThrows(RuntimeException.class, () -> cvService.deleteCv(userId));
//        verify(recommendScoreRepository, never()).deleteByCvId(any());
//        verify(restTemplate, never()).delete(anyString());
//    }
//
//    @Test
//    void deleteCv_FastApi요청실패시_예외발생() {
//        // given
//        Long userId = 1L;
//        Long cvId = 10L;
//        User user = User.builder().id(userId).build();
//        Cv cv = Cv.builder().id(cvId).user(user).build();
//
//        when(cvRepository.findByUserId(userId)).thenReturn(Optional.of(cv));
//        doThrow(new RuntimeException("FastAPI error")).when(restTemplate)
//                .delete("http://localhost:8000/delete-cv?user_id=" + userId);
//
//        // when & then
//        RuntimeException exception = assertThrows(RuntimeException.class, () -> cvService.deleteCv(userId));
//        assertTrue(exception.getMessage().contains("FastAPI 요청 실패"));
//    }

    @Test
    void summaryCv_성공() {
        // given
        Long userId = 1L;
        String rawText = "이력서 내용입니다.";

        User mockUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .build();

        Cv mockCv = Cv.builder()
                .id(10L)
                .user(mockUser)
                .rawText(rawText)
                .build();

        when(cvRepository.findByUserId(userId)).thenReturn(Optional.of(mockCv));
        when(claudeClient.generateCvSummary(rawText)).thenReturn("요약된 이력서");

        // when
        String result = cvService.summaryCv(userId);

        // then
        assertEquals("요약된 이력서", result);
        verify(cvRepository).findByUserId(userId);
        verify(claudeClient).generateCvSummary(rawText);
    }

    @Test
    void summaryCv_Cv없을때_예외발생() {
        // given
        Long userId = 999L;
        when(cvRepository.findByUserId(userId)).thenReturn(Optional.empty());

        // when & then
        assertThrows(RuntimeException.class, () -> cvService.summaryCv(userId));
    }
}