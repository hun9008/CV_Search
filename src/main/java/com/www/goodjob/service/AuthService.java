package com.www.goodjob.service;

import com.www.goodjob.domain.User;
import com.www.goodjob.domain.UserOAuth;
import com.www.goodjob.domain.UserRole;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserOAuthRepository userOAuthRepository;

    @Transactional
    public User saveOrGetUser(OAuthUserInfo userInfo) {
        return userRepository.findByEmail(userInfo.getEmail())
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(userInfo.getEmail())
                            .name(userInfo.getName())
                            .role(UserRole.USER)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    User savedUser = userRepository.save(newUser);

                    UserOAuth oauth = UserOAuth.builder()
                            .user(savedUser)
                            .provider(userInfo.getProvider())
                            .oauthId(userInfo.getOauthId())
                            .accessToken(userInfo.getAccessToken())
                            .refreshToken(userInfo.getRefreshToken())
                            .tokenExpiry(userInfo.getTokenExpiry())
                            .build();

                    userOAuthRepository.save(oauth);
                    return savedUser;
                });
    }
}