package com.www.goodjob.security;

import com.www.goodjob.enums.OAuthProvider;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

/**
 * 기본 OAuth2User를 감싸서 추가적인 메서드(예: getEmail())를 제공하는 클래스
 */
public class CustomOAuth2User implements OAuth2User {

    private final OAuth2User oAuth2User;

    public CustomOAuth2User(OAuth2User oAuth2User) {
        this.oAuth2User = oAuth2User;
    }

    public String getEmail() {
        // Kakao의 경우, email은 kakao_account 내부에 위치
        if (oAuth2User.getAttributes().containsKey("kakao_account")) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");
            return (String) kakaoAccount.get("email");
        }
        return (String) oAuth2User.getAttributes().get("email");
    }

    public String getOauthId(OAuthProvider provider) {
        if (provider == OAuthProvider.KAKAO) {
            return oAuth2User.getAttributes().get("id").toString();
        } else if (provider == OAuthProvider.GOOGLE) {
            return oAuth2User.getAttributes().get("sub").toString();
        } else {
            throw new IllegalArgumentException("Unsupported provider: " + provider);
        }
    }

    @Override
    public Map<String, Object> getAttributes() {
        return oAuth2User.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return oAuth2User.getAuthorities();
    }

    @Override
    public String getName() {
        return oAuth2User.getName();
    }
}
