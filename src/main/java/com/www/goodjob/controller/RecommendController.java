package com.www.goodjob.controller;

import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.RecommendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rec")
public class RecommendController {

    private final RecommendService recommendService;

    // 추천 리스트 조회
    @PostMapping("/topk-list")
    public ResponseEntity<String> recommendTopK(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam int topk
    ) {
        Long userId = userDetails.getId();
        String result = recommendService.requestRecommendation(userId, topk);
        return ResponseEntity.ok(result);
    }

    // 피드백 생성 or 조회
    @PostMapping("/feedback")
    public ResponseEntity<String> generateFeedback(
            @RequestParam Long recommendScoreId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String feedback = recommendService.getOrGenerateFeedback(recommendScoreId, userDetails);
        return ResponseEntity.ok(feedback);
    }
}

