package com.www.goodjob.service;

import com.www.goodjob.domain.User;
import com.www.goodjob.domain.UserOAuth;
import com.www.goodjob.enums.OAuthProvider;
import com.www.goodjob.repository.UserOAuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserOAuthRepository userOAuthRepository;

    /**
     * 소셜 로그인 후 추가 회원가입 처리 예시 (User 객체를 이미 가지고 있다고 가정)
     */
    public UserOAuth registerSocialUser(User user, String oauthId, OAuthProvider provider, String accessToken, String refreshToken) {
        UserOAuth userOAuth = UserOAuth.builder()
                .user(user)
                .oauthId(oauthId)
                .provider(provider)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenExpiry(null) // 만료 시간 세팅 필요 시
                .build();
        return userOAuthRepository.save(userOAuth);
    }
}
