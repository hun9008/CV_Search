package com.www.goodjob.controller;

import com.www.goodjob.config.TestConfig; // 전역 TestConfig import
import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockCookie;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;

@Import({TestConfig.class, TestSecurityConfig.class})
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserOAuthRepository userOAuthRepository;

    @Test
    @DisplayName("로그인 페이지 리다이렉트 - provider 있음")
    void loginPageRedirectWithProvider() throws Exception {
        mockMvc.perform(get("/auth/login?provider=google"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/oauth2/authorization/google"));
    }

    @Test
    @DisplayName("로그인 페이지 메시지 출력 - provider 없음")
    void loginPageMessageNoProvider() throws Exception {
        mockMvc.perform(get("/auth/login"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("accessToken 재발급 - 유효한 refreshToken")
    void refreshTokenValid() throws Exception {
        when(jwtTokenProvider.validateToken(anyString())).thenReturn(true);
        when(jwtTokenProvider.getEmail(anyString())).thenReturn("test@example.com");
        when(jwtTokenProvider.generateAccessToken(anyString())).thenReturn("newAccessToken");

        mockMvc.perform(post("/auth/token/refresh")
                        .cookie(new MockCookie("refresh_token", "validToken")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("newAccessToken"));
    }

    @Test
    @DisplayName("accessToken 재발급 - refreshToken 없음")
    void refreshTokenInvalid() throws Exception {
        mockMvc.perform(post("/auth/token/refresh"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("callback-endpoint 테스트")
    void callbackEndpointTest() throws Exception {
        when(jwtTokenProvider.getEmail(anyString())).thenReturn("test@example.com");
        when(jwtTokenProvider.getFirstLoginClaim(anyString())).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(anyString())).thenReturn("newAccessToken");
        when(userRepository.existsByEmail(anyString())).thenReturn(false); // 이건 actually 안 쓰일 수도 있음

        mockMvc.perform(get("/auth/callback-endpoint")
                        .cookie(new MockCookie("refresh_token", "validToken")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.accessToken").value("newAccessToken"))
                .andExpect(jsonPath("$.firstLogin").value(true));
    }

    @Test
    @DisplayName("마스터 토큰 발급 성공")
    void masterTokenSuccess() throws Exception {
        when(jwtTokenProvider.generateAccessToken(anyString())).thenReturn("adminToken");

        mockMvc.perform(post("/auth/master-token")
                        .param("key", "masterKey"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("adminToken"));
    }

    @Test
    @DisplayName("마스터 토큰 발급 실패")
    void masterTokenFail() throws Exception {
        mockMvc.perform(post("/auth/master-token")
                        .param("key", "wrongKey"))
                .andExpect(status().isUnauthorized());
    }
}
