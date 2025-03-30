package com.www.goodjob.security;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import java.util.Map;

@Getter
@ToString
@Builder
public class OAuth2Attribute {
    private Map<String, Object> attributes;
    private String email;
    private String name;
    private String picture;

    /**
     * provider 값에 따라 분기 처리하여 OAuth2Attribute 생성
     */
    public static OAuth2Attribute of(String provider, Map<String, Object> attributes) {
        if ("kakao".equalsIgnoreCase(provider)) {
            return ofKakao(attributes);
        }
        return ofGoogle(attributes);
    }

    private static OAuth2Attribute ofGoogle(Map<String, Object> attributes) {
        return OAuth2Attribute.builder()
                .email((String) attributes.get("email"))
                .name((String) attributes.get("name"))
                .picture((String) attributes.get("picture"))
                .attributes(attributes)
                .build();
    }

    @SuppressWarnings("unchecked")
    private static OAuth2Attribute ofKakao(Map<String, Object> attributes) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        String email = (String) kakaoAccount.get("email");

        Map<String, Object> kakaoProfile = (Map<String, Object>) kakaoAccount.get("profile");
        String name = (String) kakaoProfile.get("nickname");
        String picture = (String) kakaoProfile.get("profile_image_url");

        return OAuth2Attribute.builder()
                .email(email)
                .name(name)
                .picture(picture)
                .attributes(attributes)
                .build();
    }
}
