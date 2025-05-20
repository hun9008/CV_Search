package com.www.goodjob.security;

import com.www.goodjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@Component
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);
    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(userRequest);
        Map<String, Object> attributes = new HashMap<>(user.getAttributes());
        logger.debug("Received attributes: {}", attributes);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        OAuth2Attribute oAuth2Attribute = OAuth2Attribute.of(provider, attributes);

        String email = oAuth2Attribute.getEmail();
        log.debug("✅ OAuth2 로그인 시도 이메일: {}", email);

        // 🔒 여기서 차단되어야 함!
        if (!userRepository.existsByEmail(email)) {
            log.warn("❌ 회원 탈퇴된 계정 로그인 시도: {}", email);
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("WITHDRAWN_USER", "회원 탈퇴된 계정입니다.", null)
            );
        }

        attributes.put("name", oAuth2Attribute.getName());
        attributes.put("email", email);
        attributes.put("picture", oAuth2Attribute.getPicture());
        attributes.put("provider", provider);

        OAuth2User modifiedUser = new DefaultOAuth2User(
                user.getAuthorities(),
                attributes,
                "name"
        );

        return new CustomOAuth2User(modifiedUser);
    }
}
