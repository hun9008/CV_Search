package com.www.goodjob.controller;

import lombok.Data;

@Data
public class AdditionalSignUpRequest {
    // 클라이언트가 전달하는 토큰 값 (로그인 시 발급된)
    private String accessToken;
    private String refreshToken;

    // 추가 회원가입 정보 (예: 지역, 이름 등)
    private String region;
    private String name; // 선택 사항
}
