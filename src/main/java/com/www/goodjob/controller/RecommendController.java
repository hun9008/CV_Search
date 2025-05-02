package com.www.goodjob.controller;

import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.RecommendService;
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

    @Operation(
            summary = "추천 공고 Top-K 리스트 반환",
            description = """
        사용자의 이력서를 기반으로 추천 점수 상위 K개의 공고 리스트를 반환함 /
        FastAPI 서버와 연동하여 추천 결과를 가져옴
        """
    )
    // 추천 리스트 조회
    @PostMapping("/topk-list")
    public ResponseEntity<List<ScoredJobDto>> recommendTopK(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam int topk
    ) {
        Long userId = userDetails.getId();
        List<ScoredJobDto> result = recommendService.requestRecommendation(userId, topk);
        return ResponseEntity.ok(result);
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

