package com.www.goodjob.controller;


import com.www.goodjob.dto.UserFeedbackDto;
import com.www.goodjob.service.UserFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/feedback")
@RequiredArgsConstructor
@Tag(name = "[ADMIN] User Feedback", description = "[관리자 전용] 사용자 피드백 API")
public class UserFeedbackAdminController {

    private final UserFeedbackService feedbackService;

    @Operation(summary = "전체 피드백 목록 조회", description = "모든 사용자 피드백을 조회합니다"
            + "req: GET /admin/feedback , res: [ { ...피드백 응답 객체... } ]"
    )
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserFeedbackDto.Response> getAllFeedback() {
        return feedbackService.getAllFeedback();
    }

    @Operation(summary = "키워드 기반 피드백 검색", description = "피드백 내용에서 키워드를 포함하는 항목을 검색합니다"
    + "req: GET /admin/feedback/search?keyword=정확해요 , res: [ { ...피드백 응답 객체... } ]"
    )
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserFeedbackDto.Response> searchFeedback(@RequestParam String keyword) {
        return feedbackService.searchFeedback(keyword);
    }

    @Operation(summary = "기간별 피드백 조회", description = "주/월/연 단위의 피드백을 조회합니다"
    +  "req: GET /admin/feedback/period?period=month (period: week, month, year 중 하나), res: [ { ...피드백 응답 객체... } ]"
    )
    @GetMapping("/period")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserFeedbackDto.Response> getFeedbackByPeriod(@RequestParam String period) {
        return feedbackService.getFeedbackByPeriod(period);
    }

    @Operation(summary = "평균 만족도 통계", description = "전체 피드백의 평균 별점 점수를 조회합니다"
    + " req: GET /admin/feedback/average, res: 4.3 (Double)"
    )
    @GetMapping("/average")
    @PreAuthorize("hasRole('ADMIN')")
    public Double getAverageScore() {
        return feedbackService.getAverageSatisfaction();
    }

    @Operation(summary = "피드백 총 개수 조회", description = "전체 피드백의 총 개수를 조회합니다"
    + " req: GET /admin/feedback/count, res: 127 (Long)")
    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN')")
    public Long getTotalFeedbackCount() {
        return feedbackService.getTotalFeedbackCount();
    }

    @Operation(summary = "피드백 수정", description = "피드백 내용을 수정합니다, 수정 성공 시 204 응답")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateFeedback(@PathVariable Long id, @RequestBody UserFeedbackDto.Update dto) {
        feedbackService.updateFeedback(id, dto);
    }

    @Operation(summary = "피드백 삭제", description = "특정 피드백을 삭제합니다, 삭제 성공 시 204 응답")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
    }
}
