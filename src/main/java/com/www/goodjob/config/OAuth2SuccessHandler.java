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

        // 기존 User가 있으면 조회, 없으면 신규 생성 (소셜 로그인만 사용하는 환경)
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .name(customUser.getName())
                            .build();
                    return userRepository.save(newUser);
                });

        // UserOAuth 처리: 기존 소셜 정보가 있으면 업데이트, 없으면 생성
        UserOAuth userOAuth = userOAuthRepository.findByUser_Email(email)
                .orElseGet(() -> {
                    UserOAuth newUserOAuth = UserOAuth.builder()
                            .user(user)
                            .oauthId(String.valueOf(oAuth2User.getAttributes().get("id")))
                            .provider(jwtTokenProvider.extractProvider(oAuth2User))
                            .build();
                    return userOAuthRepository.save(newUserOAuth);
                });

        // JWT 토큰 생성 (Access & Refresh)
        String accessToken = jwtTokenProvider.generateAccessToken(email);
        String refreshToken = jwtTokenProvider.generateRefreshToken(email);

        log.info("OAuth2 로그인 성공: email={}, accessToken={}, refreshToken={}", email, accessToken, refreshToken);

        // 프론트엔드(혹은 테스트용 백엔드 페이지)로 리다이렉트 (예: /auth/redirect)
        String redirectUrl = UriComponentsBuilder.fromUriString("http://localhost:8080/auth/redirect")
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
