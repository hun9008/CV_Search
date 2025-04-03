package com.www.goodjob.controller;

import com.www.goodjob.domain.User;
import com.www.goodjob.domain.UserOAuth;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.service.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserOAuthRepository userOAuthRepository;
    private final JwtTokenProvider jwtTokenProvider;

    // 회원가입(추가 정보 입력) API
    @PostMapping("/signup")
    public User signup(@RequestHeader("Authorization") String token,
                       @RequestBody AdditionalSignUpRequest request) {
        // Authorization 헤더가 "Bearer <token>" 형식이면 "Bearer " 제거
        String jwtToken = token.startsWith("Bearer ") ? token.substring(7) : token;

        // JWT 토큰에서 이메일 추출
        String email = jwtTokenProvider.getEmail(jwtToken);

        // 기존 User 조회 (로그인 시 이미 생성된 상태)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // 추가 회원가입 정보로 User 업데이트 (예: region, name)
        user.setRegion(request.getRegion());
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        userRepository.save(user);

        // UserOAuth 정보 업데이트: 로그인 시 토큰은 저장하지 않았으므로, 회원가입 시점에서 DB에 저장
        UserOAuth userOAuth = userOAuthRepository.findByUser_Email(email)
                .orElseThrow(() -> new IllegalStateException("UserOAuth not found"));
        userOAuth.setAccessToken(request.getAccessToken());
        userOAuth.setRefreshToken(request.getRefreshToken());
        userOAuthRepository.save(userOAuth);

        return user;
    }
}
