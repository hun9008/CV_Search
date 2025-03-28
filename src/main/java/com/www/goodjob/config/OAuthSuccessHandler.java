package com.www.goodjob.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuthSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String oauthId = oAuth2User.getName();
        String provider = authentication.getAuthorities().stream()
                .findFirst().orElseThrow().getAuthority();

        // 여기서 DB 저장 로직 or JWT 발급 로직 호출 가능

        // 예시: 토큰 생성 후 리디렉션
        String jwtToken = "mock-jwt-token"; // JWT 생성 로직 필요
        response.sendRedirect("http://localhost:3000/oauth/redirect?token=" + jwtToken);
    }
}