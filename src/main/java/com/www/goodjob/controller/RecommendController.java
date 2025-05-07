package com.www.goodjob.controller;

import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.AsyncService;
import com.www.goodjob.service.RecommendService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "추천 API", description = "이력서를 기반으로 한 채용 공고 추천 및 피드백")
@RestController
@RequiredArgsConstructor
@RequestMapping("/rec")
public class RecommendController {

    private final RecommendService recommendService;
    private final AsyncService asyncService;

    // 추천 리스트 조회
    @PostMapping("/topk-list")
    @Operation(
            summary = "추천 리스트 조회",
            description = "유저의 ID를 기반된으로 Redis에 캐시 데이터 중 상위 topK개의 추천 직무 리스트를 반환합니다." +
                    "Redis에 캐시된 데이터가 없다면 FastAPI의 결과를 반환하며, 백그라운드로(Async) 캐시 작업을 시작합니다."
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

    @Operation(
            summary = "추천 캐시 생성",
            description = "[Not Used] 관리용으로 호출될 수 있습니다. FastAPI로부터 전체 추천 점수를 받아 Redis에 캐싱합니다. (Sync)"
    )
    @GetMapping("/cache")
    public ResponseEntity<String> cacheRecommendationForUser(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new RuntimeException("인증되지 않은 사용자입니다. JWT를 확인하세요.");
        }

        Long userId = userDetails.getId();
        asyncService.cacheRecommendForUser(userId);
        return ResponseEntity.ok("추천 캐시 생성 시작. log 확인 필요.");
    }

    @Operation(
            summary = "추천 공고에 대한 이력서 피드백 생성 또는 조회",
            description = """
            특정 추천 항목(recommendScoreId)에 대한 이력서 피드백을 생성하거나, 
            이미 생성된 피드백이 있으면 그대로 반환함
            - Claude AI 기반으로 자동 생성됨  
            - 이미 피드백이 있다면 새로 생성하지 않고 그대로 반환함
            """
    )

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



