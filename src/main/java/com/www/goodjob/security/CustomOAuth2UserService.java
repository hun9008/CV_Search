package com.www.goodjob.security;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@Component
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 기본 사용자 정보를 로드합니다.
        OAuth2User user = super.loadUser(userRequest);
        // 기존 attributes를 수정 가능한 맵으로 복사
        Map<String, Object> attributes = new HashMap<>(user.getAttributes());
        logger.debug("Received attributes: {}", attributes);

        // provider 값 (예: "kakao", "google")은 clientRegistration의 registrationId를 사용합니다.
        String provider = userRequest.getClientRegistration().getRegistrationId();

        // OAuth2Attribute를 통해 provider별 사용자 정보를 추출합니다.
        OAuth2Attribute oAuth2Attribute = OAuth2Attribute.of(provider, attributes);

        // 필요한 값("name", "email", "picture")을 attributes에 추가 또는 덮어씁니다.
        attributes.put("name", oAuth2Attribute.getName());
        attributes.put("email", oAuth2Attribute.getEmail());
        attributes.put("picture", oAuth2Attribute.getPicture());
        attributes.put("provider", provider);

        // "name" 속성을 기준으로 DefaultOAuth2User를 생성합니다.
        OAuth2User modifiedUser = new DefaultOAuth2User(
                user.getAuthorities(),
                attributes,
                "name"
        );

        // CustomOAuth2User로 감싸서 추가 메서드(getEmail() 등)를 제공하도록 합니다.
        return new CustomOAuth2User(modifiedUser);
    }
}
