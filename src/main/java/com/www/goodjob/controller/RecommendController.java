package com.www.goodjob.controller;

import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.RecommendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/recommend")
public class RecommendController {

    private final RecommendService recommendService;

    @PostMapping("/topk_list")
    public ResponseEntity<String> recommend(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam int topk
    ) {
        Long userId = userDetails.getId();
        String result = recommendService.requestRecommendation(userId, topk);
        return ResponseEntity.ok(result);
    }
}
