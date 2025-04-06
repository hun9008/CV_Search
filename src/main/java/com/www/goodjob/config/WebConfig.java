package com.www.goodjob.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("https://localhost:5173") // 프론트 도메인
                // .allowedOrigins("https://goodjob.ai.kr") // 프론트 도메인
                .allowedMethods("*")
                .allowCredentials(true); // refreshToken 쿠키 전송 허용
    }
}
