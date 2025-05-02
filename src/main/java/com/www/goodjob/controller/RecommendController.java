package com.www.goodjob.controller;

import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.RecommendService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rec")
public class RecommendController {

    private final RecommendService recommendService;

    // 추천 리스트 조회
    @PostMapping("/topk-list")
    @Operation(
            summary = "추천 리스트 조회",
            description = "유저의 ID를 기반된으로 Redis에 캐시 데이터 중 상위 topK개의 추천 직무 리스트를 반환합니다." +
                    "Redis에 캐시된 데이터가 없다면 에러입니다."
    )
    public ResponseEntity<List<ScoredJobDto>> recommendTopK(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam int topk
    ) {
        if (userDetails == null) {
            throw new RuntimeException("인증되지 않은 사용자입니다. JWT를 확인하세요.");
        }
        Long userId = userDetails.getId();
        List<ScoredJobDto> result = recommendService.requestRecommendation(userId, topk);
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

    @Operation(
            summary = "추천 캐시 생성",
            description = "FastAPI로부터 전체 추천 점수를 받아 Redis에 캐싱합니다. 사용자 로그인 시점이나 관리용으로 호출될 수 있습니다."
    )
    @GetMapping("/cache")
    public ResponseEntity<String> cacheRecommendationForUser(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("인증되지 않은 사용자입니다. JWT를 확인하세요.");
        }

        Long userId = userDetails.getId();
        recommendService.cacheRecommendForUser(userId);
        return ResponseEntity.ok("추천 캐시가 생성되었습니다.");
    }
}



