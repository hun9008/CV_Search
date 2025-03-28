package com.www.goodjob.config;

import com.www.goodjob.service.AuthService;
import com.www.goodjob.service.JwtTokenProvider;
import com.www.goodjob.service.OAuthUserInfo;
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

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthService authService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        OAuthUserInfo userInfo = OAuthUserInfo.builder()
                .email(oAuth2User.getAttribute("email"))
                .name(oAuth2User.getAttribute("name"))
                .provider("google")
                .oauthId(oAuth2User.getName())
                .accessToken("token-sample")
                .refreshToken("refresh-sample")
                .tokenExpiry(null)
                .build();

        authService.saveOrGetUser(userInfo);

        String jwtToken = jwtTokenProvider.createToken(userInfo.getEmail());
        response.sendRedirect("http://localhost:3000/oauth/redirect?token=" + jwtToken);
    }
}