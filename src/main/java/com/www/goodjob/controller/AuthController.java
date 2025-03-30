package com.www.goodjob.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    // 커스텀 로그인 페이지 (provider 파라미터 옵션 처리)
    @GetMapping("/login")
    public String loginPage(@RequestParam(value = "provider", required = false) String provider) {
        if (provider == null || provider.isEmpty()) {
            return "로그인 페이지입니다. 사용 가능한 provider: google, kakao. 예: /auth/login?provider=kakao";
        }
        return "소셜 로그인 진행 (" + provider + ")";
    }

    // OAuthSuccessHandler에서 리다이렉트 후, 토큰을 확인하는 엔드포인트
    @GetMapping("/redirect")
    public String redirectAfterLogin(@RequestParam String accessToken,
                                     @RequestParam String refreshToken) {
        return "Login Success! AccessToken=" + accessToken + ", RefreshToken=" + refreshToken;
    }

    // 추가 회원가입(추가 정보 입력)이 필요한 경우 (예시)
    @PostMapping("/signup")
    public String signup(@RequestHeader("Authorization") String token,
                         @RequestParam String region) {
        return "Sign Up Success (region = " + region + ")";
    }
}
