package com.www.goodjob.service;

import com.www.goodjob.dto.DashboardDto;
import com.www.goodjob.dto.KeywordCount;
import com.www.goodjob.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Pageable;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardServiceTest {

    @InjectMocks
    private DashboardService dashboardService;

    @Mock
    private JobRepository jobRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserFeedbackRepository userFeedbackRepository;
    @Mock private SearchLogRepository searchLogRepository;
    @Mock private JobEventLogRepository jobEventLogRepository;


    @Test
    void getDashboardStats_returnsAggregatedStats() {
        // 날짜 기반 계산 (고정 날짜 기준으로 테스트)
        LocalDate now = LocalDate.of(2025, 6, 8); // 기준 날짜
        LocalDateTime startOfThisWeek = now.with(DayOfWeek.MONDAY).atStartOfDay(); // 2025-06-02
        LocalDateTime startOfLastWeek = startOfThisWeek.minusWeeks(1);             // 2025-05-26
        LocalDateTime endOfLastWeek = startOfThisWeek.minusSeconds(1);             // 2025-06-01T23:59:59

        // mock 리턴값 설정
        when(userRepository.count()).thenReturn(100L);
        when(userRepository.countByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(20L);
        when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(10L);

        when(jobRepository.count()).thenReturn(500L);
        when(jobRepository.countByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(50L);
        when(jobRepository.countByCreatedAtBetween(any(), any())).thenReturn(30L);

        when(userFeedbackRepository.getAverageSatisfaction()).thenReturn(4.2f);
        when(userFeedbackRepository.getAverageSatisfactionBetween(any(), any())).thenReturn(3.8f);

        List<KeywordCount> keywordList = List.of(
                new KeywordCount("AI", 30),
                new KeywordCount("백엔드", 20)
        );
        when(searchLogRepository.findTopKeywords(any(Pageable.class))).thenReturn(keywordList);

        when(jobEventLogRepository.countActiveUsersSince(any(LocalDateTime.class)))
                .thenReturn(60L)
                .thenReturn(40L);

        when(jobEventLogRepository.countImpressionsSince(any(LocalDateTime.class))).thenReturn(200L);
        when(jobEventLogRepository.countClicksSince(any(LocalDateTime.class))).thenReturn(40L);

        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = now.minusDays(i);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1).minusSeconds(1);

            when(jobEventLogRepository.countImpressionsBetween(startOfDay, endOfDay)).thenReturn(100L + i);
            when(jobEventLogRepository.countClicksBetween(startOfDay, endOfDay)).thenReturn(10L + i);
        }

        // when
        DashboardDto result = dashboardService.getDashboardStats();

        // then (필드명 기준 getter 사용)
        assertEquals(100L, result.getTotalUserCount());
        assertEquals(10, result.getWeeklyUserChange());
        assertEquals(500L, result.getTotalJobCount());
        assertEquals(20, result.getWeeklyJobChange());
        assertEquals(4.2f, result.getAverageSatisfaction(), 0.001f);
        assertEquals(0.4f, result.getWeeklySatisfactionChange(), 0.001f);
        assertEquals(60L, result.getActiveUserCount());
        assertEquals(20, result.getWeeklyActiveUserChange());
        assertEquals(20.0f, result.getCtr(), 0.001f); // 40 / 200 * 100

        assertEquals(7, result.getDailyCtrList().size());
        assertEquals(keywordList, result.getTopKeywords());
    }
}