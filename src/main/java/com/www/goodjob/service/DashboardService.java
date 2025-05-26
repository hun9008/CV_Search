package com.www.goodjob.service;

import com.www.goodjob.dto.DashboardDto;
import com.www.goodjob.dto.KeywordCount;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.SearchLogRepository;
import com.www.goodjob.repository.UserFeedbackRepository;
import com.www.goodjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final UserFeedbackRepository userFeedbackRepository;
    private final SearchLogRepository searchLogRepository;

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


        return new DashboardDto(
                totalUsers,
                weeklyUserChange,
                totalJobs,
                weeklyJobChange,
                averageSatisfaction != null ? averageSatisfaction : 0f,
                weeklySatisfactionChange,
                topKeywords
        );
    }
}
