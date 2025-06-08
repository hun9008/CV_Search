package com.www.goodjob.config;

import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomUserDetailsService;
import com.www.goodjob.security.JwtTokenProvider;
import com.www.goodjob.service.*;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class GlobalMockBeans {

    @Bean
    public JwtTokenProvider jwtTokenProvider() {
        return Mockito.mock(JwtTokenProvider.class);
    }

    @Bean
    public UserRepository userRepository() {
        return Mockito.mock(UserRepository.class);
    }

    @Bean
    public UserOAuthRepository userOAuthRepository() {
        return Mockito.mock(UserOAuthRepository.class);
    }

    @Bean
    public AuthService authService() {
        return Mockito.mock(AuthService.class);
    }

    @Bean
    public CustomUserDetailsService customUserDetailsService() {
        return Mockito.mock(CustomUserDetailsService.class);
    }

    @Bean
    public UserFeedbackService userFeedbackService() {
        return Mockito.mock(UserFeedbackService.class);
    }

    @Bean
    public TossPaymentService tossPaymentService() {
        return Mockito.mock(TossPaymentService.class);
    }

    @Bean
    public JobService jobService() {
        return Mockito.mock(JobService.class);
    }

    @Bean
    public SearchLogService searchLogService() {
        return Mockito.mock(SearchLogService.class);
    }

    // 추가적으로 필요한 Mock 빈은 이곳에 계속 추가하면 됩니다.
}
