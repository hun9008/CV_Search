package com.www.goodjob.service;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class OAuthUserInfo {
    private String provider;
    private String oauthId;
    private String email;
    private String name;
    private String accessToken;
    private String refreshToken;
    private LocalDateTime tokenExpiry;
}