package com.www.goodjob.controller;

import com.www.goodjob.domain.User;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.service.JwtTokenProvider;
import com.www.goodjob.service.RecommendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/recommend")
public class RecommendController {

    private final RecommendService recommendService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @PostMapping("/topk_list")
    public ResponseEntity<String> recommend(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam int topk
    ) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtTokenProvider.getEmail(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long userId = user.getId();

        String result = recommendService.requestRecommendation(userId, topk);
        return ResponseEntity.ok(result);
    }
}
