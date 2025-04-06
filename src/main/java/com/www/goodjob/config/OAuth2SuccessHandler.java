package com.www.goodjob.config;

import com.www.goodjob.domain.User;
import com.www.goodjob.domain.UserOAuth;
import com.www.goodjob.enums.OAuthProvider;
import com.www.goodjob.enums.UserRole;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomOAuth2User;
import com.www.goodjob.service.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@RequiredArgsConstructor
@Component
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final UserOAuthRepository userOAuthRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        CustomOAuth2User customUser = (oAuth2User instanceof CustomOAuth2User)
                ? (CustomOAuth2User) oAuth2User
                : new CustomOAuth2User(oAuth2User);

        String email = customUser.getEmail();
        String name = customUser.getName();
        OAuthProvider provider = extractProvider(customUser);
        String oauthId = customUser.getOauthId(provider);

        boolean isFirstLogin = false;
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = userRepository.save(User.builder()
                    .email(email)
                    .name(name)
                    .role(UserRole.USER)
                    .build());

            userOAuthRepository.save(UserOAuth.builder()
                    .user(user)
                    .provider(provider)
                    .oauthId(oauthId)
                    .build());

            isFirstLogin = true;
        }

        // JWT 발급
        String accessToken = jwtTokenProvider.generateAccessToken(email);
        String refreshToken = jwtTokenProvider.generateRefreshToken(email);

        // RefreshToken은 HttpOnly 쿠키로 저장
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true) // HTTPS니까 true로
                .path("/")
                .maxAge(Duration.ofDays(14))
                .sameSite("None") // 크로스 도메인 + 쿠키 전달 허용
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

        request.getSession().setAttribute("accessToken", accessToken);
        request.getSession().setAttribute("firstLogin", isFirstLogin);

        // 프론트 전용 redirect
        response.sendRedirect("https://localhost:5173/auth/callback");

        // 백에서 test
        // response.sendRedirect("http://localhost:8080/auth/callback");

    }

    private OAuthProvider extractProvider(CustomOAuth2User user) {
        // provider 정보는 attributes에서 직접 추출
        if (user.getAttributes().containsKey("provider")) {
            return OAuthProvider.valueOf(user.getAttributes().get("provider").toString().toUpperCase());
        }
        throw new IllegalStateException("OAuth provider not found in user attributes");
    }
}

