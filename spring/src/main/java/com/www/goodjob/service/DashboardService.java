package com.www.goodjob.service;

import com.www.goodjob.dto.DashboardDto;
import com.www.goodjob.dto.KeywordCount;
import com.www.goodjob.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final UserFeedbackRepository userFeedbackRepository;
    private final SearchLogRepository searchLogRepository;
    private final JobEventLogRepository jobEventLogRepository;

    public DashboardDto getDashboardStats() {
        LocalDateTime startOfThisWeek = LocalDate.now().with(java.time.DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime startOfLastWeek = startOfThisWeek.minusWeeks(1);
        LocalDateTime endOfLastWeek = startOfThisWeek.minusSeconds(1);

        // 1. 총 유저 수
        long totalUsers = userRepository.count();

        // 2. 이번 주 생성 유저 수
        long thisWeekUsers = userRepository.countByCreatedAtAfter(startOfThisWeek);

        // 3. 지난 주 생성 유저 수
        long lastWeekUsers = userRepository.countByCreatedAtBetween(startOfLastWeek, endOfLastWeek);

        int weeklyUserChange = (int)(thisWeekUsers - lastWeekUsers);

        // 4. 총 채용공고 수
        long totalJobs = jobRepository.count();

        // 5. 이번 주 채용공고 수
        long thisWeekJobs = jobRepository.countByCreatedAtAfter(startOfThisWeek);

        // 6. 지난 주 채용공고 수
        long lastWeekJobs = jobRepository.countByCreatedAtBetween(startOfLastWeek, endOfLastWeek);

        int weeklyJobChange = (int)(thisWeekJobs - lastWeekJobs);

        // 7. 평균 만족도
        Float averageSatisfaction = userFeedbackRepository.getAverageSatisfaction();

        // 9. 지난 주 평균 만족도
        Float lastWeekSatisfaction = userFeedbackRepository.getAverageSatisfactionBetween(startOfLastWeek, endOfLastWeek);

        float weeklySatisfactionChange =
                (averageSatisfaction != null ? averageSatisfaction : 0f) -
                        (lastWeekSatisfaction != null ? lastWeekSatisfaction : 0f);

        List<KeywordCount> topKeywords = searchLogRepository.findTopKeywords(PageRequest.of(0, 10));

        long activeUsersThisWeek = jobEventLogRepository.countActiveUsersSince(startOfThisWeek);
        long activeUsersLastWeek = jobEventLogRepository.countActiveUsersSince(startOfLastWeek);
        int activeUserDiff = (int)(activeUsersThisWeek - activeUsersLastWeek);

        long impressions = jobEventLogRepository.countImpressionsSince(startOfThisWeek);
        long clicks = jobEventLogRepository.countClicksSince(startOfThisWeek);

        float ctr = impressions > 0 ? ((float) clicks / impressions) * 100 : 0f;

        List<Float> dailyCtrList = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = LocalDate.now().minusDays(i);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1).minusSeconds(1);

            long dailyImpressions = jobEventLogRepository.countImpressionsBetween(startOfDay, endOfDay);
            long dailyClicks = jobEventLogRepository.countClicksBetween(startOfDay, endOfDay);

            float dailyCtr = dailyImpressions > 0 ? ((float) dailyClicks / dailyImpressions) * 100 : 0f;
            dailyCtrList.add(dailyCtr);
        }

        return new DashboardDto(
                totalUsers,
                weeklyUserChange,
                totalJobs,
                weeklyJobChange,
                averageSatisfaction != null ? averageSatisfaction : 0f,
                weeklySatisfactionChange,
                activeUsersThisWeek,
                activeUserDiff,
                ctr,
                dailyCtrList,
                topKeywords
        );
    }
}
