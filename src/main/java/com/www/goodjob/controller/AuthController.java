package com.www.goodjob.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    // 커스텀 로그인 페이지 (provider 파라미터 옵션 처리)
    @GetMapping("/login")
    public void loginPage(@RequestParam(value = "provider", required = false) String provider,
                          HttpServletResponse response) throws IOException {
        if (provider == null || provider.isEmpty()) {
            // 프론트엔드와 연동 중이면, 여기서 텍스트 응답 대신 프론트엔드의 로그인 페이지 주소로 리다이렉트할 수도 있습니다.
            response.getWriter().write("로그인 페이지입니다. 사용 가능한 provider: google, kakao. 예: /auth/login?provider=kakao");
        } else {
            // provider 파라미터가 있을 경우, Spring Security의 기본 OAuth2 인증 엔드포인트로 리다이렉트합니다.
            // 예: /oauth2/authorization/google 또는 /oauth2/authorization/kakao
            response.sendRedirect("/oauth2/authorization/" + provider.toLowerCase());
        }
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
