package com.www.goodjob.config;

import com.www.goodjob.domain.User;
import com.www.goodjob.domain.UserOAuth;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomOAuth2User;
import com.www.goodjob.service.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserOAuthRepository userOAuthRepository;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        CustomOAuth2User customUser = (oAuth2User instanceof CustomOAuth2User)
                ? (CustomOAuth2User) oAuth2User
                : new CustomOAuth2User(oAuth2User);

        String email = customUser.getEmail();

        // JWT 토큰 생성 (Access & Refresh)
        String accessToken = jwtTokenProvider.generateAccessToken(email);
        String refreshToken = jwtTokenProvider.generateRefreshToken(email);

        log.info("OAuth2 로그인 성공: email={}, accessToken={}, refreshToken={}", email, accessToken, refreshToken);

        String frontEndUrl = "http://goodjob.ai.kr/auth/redirect";
        String redirectUrl = UriComponentsBuilder.fromUriString(frontEndUrl)
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        // 리다이렉트: 프론트엔드에서는 이 페이지에서 토큰을 받아 검증한 후 메인 페이지로 이동
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
