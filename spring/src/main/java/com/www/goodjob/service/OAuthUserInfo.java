package com.www.goodjob.service;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
@Builder
public class OAuthUserInfo {
    private String email;
    private String name;
    private String picture;
}
