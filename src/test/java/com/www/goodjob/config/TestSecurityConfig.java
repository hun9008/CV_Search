package com.www.goodjob.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@TestConfiguration
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // CSRF 비활성화
                .formLogin(form -> form.disable()) // 로그인 폼 제거 (302 리디렉트 방지)
                .httpBasic(httpBasic -> httpBasic.disable()) // HTTP Basic 인증 제거
                .logout(logout -> logout.disable()) // 로그아웃 제거
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .anyRequest().authenticated() // 모든 요청 인증 필요
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(401, "Unauthorized")) // 인증 실패 시 401 반환
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                response.sendError(403, "Forbidden")) // 권한 부족 시 403 반환
                );

        return http.build();
    }
}
