package com.www.goodjob.service;


import com.www.goodjob.domain.UserFeedback;
import com.www.goodjob.dto.UserFeedbackDto;
import com.www.goodjob.repository.UserFeedbackRepository;
import com.www.goodjob.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserFeedbackService {

    private final UserFeedbackRepository feedbackRepository;

    public void createFeedback(User user, UserFeedbackDto.Create dto) {
        UserFeedback feedback = UserFeedback.builder()
                .user(user)
                .content(dto.getContent())
                .satisfactionScore(dto.getSatisfactionScore())
                .build();
        feedbackRepository.save(feedback);
    }

    public void updateFeedback(Long id, UserFeedbackDto.Update dto) {
        UserFeedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));
        feedback.setContent(dto.getContent());
        feedback.setSatisfactionScore(dto.getSatisfactionScore());
        feedbackRepository.save(feedback);
    }

    public void deleteMyFeedback(Long feedbackId, User user) {
        UserFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("해당 피드백이 존재하지 않습니다."));
        if (!feedback.getUser().getId().equals(user.getId())) {
            throw new SecurityException("본인의 피드백만 삭제할 수 있습니다.");
        }
        feedbackRepository.delete(feedback);
    }

    public void deleteFeedback(Long id) {
        feedbackRepository.deleteById(id);
    }

    public void deleteAllByUser(User user) {
        feedbackRepository.deleteAllByUser(user);
    }

    public List<UserFeedbackDto.Response> getAllFeedback() {
        return feedbackRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<UserFeedbackDto.Response> getFeedbackByUser(User user) {
        return feedbackRepository.findByUser(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<UserFeedbackDto.Response> searchFeedback(String keyword) {
        return feedbackRepository.findByContentContaining(keyword).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<UserFeedbackDto.Response> getFeedbackByPeriod(String period) {
        LocalDateTime start;
        switch (period.toLowerCase()) {
            case "week" -> start = LocalDate.now().with(java.time.DayOfWeek.MONDAY).atStartOfDay();
            case "month" -> start = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            case "year" -> start = LocalDate.now().with(TemporalAdjusters.firstDayOfYear()).atStartOfDay();
            default -> throw new IllegalArgumentException("Invalid period: must be week, month, or year");
        }
        LocalDateTime end = LocalDateTime.now();
        return feedbackRepository.findByCreatedAtBetween(start, end).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Double getAverageSatisfaction() {
        return feedbackRepository.getAverageSatisfactionScore();
    }

    public Long getTotalFeedbackCount() {
        return feedbackRepository.countTotalFeedback();
    }

    private UserFeedbackDto.Response toDto(UserFeedback f) {
        return UserFeedbackDto.Response.builder()
                .id(f.getId())
                .userId(f.getUser().getId())
                .userName(f.getUser().getName())
                .content(f.getContent())
                .satisfactionScore(f.getSatisfactionScore())
                .createdAt(f.getCreatedAt())
                .build();
    }
}