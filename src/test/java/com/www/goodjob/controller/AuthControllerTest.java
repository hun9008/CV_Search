package com.www.goodjob.controller;

import com.www.goodjob.config.GlobalMockBeans;
import com.www.goodjob.config.TestConfig; // 전역 TestConfig import
import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.JwtTokenProvider;
import com.www.goodjob.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockCookie;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;

@Import({GlobalMockBeans.class, TestSecurityConfig.class})
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @TestConfiguration
    static class MockedBeans {
        @Bean
        public JwtTokenProvider jwtTokenProvider() {
            return mock(JwtTokenProvider.class);
        }

        @Bean
        public UserRepository userRepository() {
            return mock(UserRepository.class);
        }

        @Bean
        public UserOAuthRepository userOAuthRepository() {
            return mock(UserOAuthRepository.class);
        }

        @Bean
        public AuthService authService() {
            return mock(AuthService.class);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserOAuthRepository userOAuthRepository;

    @Autowired
    private AuthService authService;

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
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("로그인 페이지입니다")));
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
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid or missing refresh token"));
    }

    @Test
    @DisplayName("callback-endpoint 테스트")
    void callbackEndpointTest() throws Exception {
        when(jwtTokenProvider.getEmail(anyString())).thenReturn("test@example.com");
        when(jwtTokenProvider.getFirstLoginClaim(anyString())).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(anyString())).thenReturn("newAccessToken");

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
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid master key"));
    }
}
