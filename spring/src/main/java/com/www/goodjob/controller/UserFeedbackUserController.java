package com.www.goodjob.controller;

import com.www.goodjob.dto.UserFeedbackDto;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.UserFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user/feedback")
@RequiredArgsConstructor
@Tag(name = "[USER] User Feedback", description = "[유저 전용] 사용자 피드백 API")
public class UserFeedbackUserController {

    private final UserFeedbackService feedbackService;

    @Operation(
            summary = "피드백 작성",
            description = """
            로그인한 사용자가 피드백을 작성합니다.
            
            req:
            {
              "content": "추천 기능이 너무 마음에 들어요!",
              "satisfactionScore": 5
            }
            
            res:
            200 No Content
            """
    )
    @PostMapping
    public void createFeedback(@AuthenticationPrincipal CustomUserDetails userDetails,
                               @RequestBody UserFeedbackDto.Create dto) {
        feedbackService.createFeedback(userDetails.getUser(), dto);
    }

    @Operation(
            summary = "내가 작성한 피드백 조회",
            description = """
            로그인한 사용자가 본인의 피드백을 조회합니다.
            
            req: 별도 바디 필요 없음. 로그인 토큰 필요
            
            res:
            [
              {
                "id": 12,
                "userId": 5,
                "userName": "홍길동",
                "content": "채용 공고 추천이 정확해요!",
                "satisfactionScore": 5,
                "createdAt": "2025-05-24T10:23:45"
              },
              {
                "id": 8,
                "userId": 5,
                "userName": "홍길동",
                "content": "모바일 화면에서 버튼이 작아서 불편했어요.",
                "satisfactionScore": 2,
                "createdAt": "2025-05-20T18:52:10"
              }
            ]
            """
    )
    @GetMapping("/me")
    public List<UserFeedbackDto.Response> getMyFeedback(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return feedbackService.getFeedbackByUser(userDetails.getUser());
    }

    @Operation(
            summary = "내 피드백 삭제",
            description = """
        로그인한 사용자가 본인이 작성한 피드백을 삭제합니다.

        req:
        DELETE /api/feedback/{id}
        - PathVariable: id = 삭제할 피드백의 고유 ID

        res:
        204 No Content
        """
    )
    @DeleteMapping("/{id}")
    public void deleteMyFeedback(@AuthenticationPrincipal CustomUserDetails userDetails,
                                 @PathVariable Long id) {
        feedbackService.deleteMyFeedback(id, userDetails.getUser());
    }

}
