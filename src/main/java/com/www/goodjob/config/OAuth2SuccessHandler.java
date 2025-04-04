package com.www.goodjob.config;

import com.www.goodjob.security.CustomOAuth2User;
import com.www.goodjob.service.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        // SecurityContext 수동 설정
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        // 세션에도 저장 (필요 시)
        HttpSessionSecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();
        securityContextRepository.saveContext(context, request, response);

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        CustomOAuth2User customUser = (oAuth2User instanceof CustomOAuth2User)
                ? (CustomOAuth2User) oAuth2User
                : new CustomOAuth2User(oAuth2User);

        String email = customUser.getEmail();

        // JWT 생성
        String accessToken = jwtTokenProvider.generateAccessToken(email);
        String refreshToken = jwtTokenProvider.generateRefreshToken(email);

        // HttpOnly 쿠키에 refreshToken 저장
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(14))
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

        // 프론트로 accessToken 전달 (프론트용 or 테스트용 중 선택)
        // String redirectUrl = "http://localhost:5173/auth/callback?accessToken=" + accessToken;
        String redirectUrl = "http://localhost:8080/auth/callback?accessToken=" + accessToken;

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
