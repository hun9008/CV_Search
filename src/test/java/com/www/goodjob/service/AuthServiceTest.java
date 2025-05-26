package com.www.goodjob.service;

import com.www.goodjob.domain.User;
import com.www.goodjob.repository.ApplicationRepository;
import com.www.goodjob.repository.SearchLogRepository;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private UserOAuthRepository userOAuthRepository;
    private SearchLogRepository searchLogRepository;
    private ApplicationRepository applicationRepository;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userOAuthRepository = mock(UserOAuthRepository.class);
        searchLogRepository = mock(SearchLogRepository.class);
        applicationRepository = mock(ApplicationRepository.class);

        authService = new AuthService(userRepository, userOAuthRepository, searchLogRepository, applicationRepository);
    }

    @Test
    @DisplayName("회원 탈퇴 시 모든 관련 데이터가 삭제되어야 함")
    void withdraw_deletesAllAssociatedData() {
        // given
        User user = new User();
        user.setId(1L);

        // when
        authService.withdraw(user);

        // then
        verify(searchLogRepository, times(1)).deleteAllByUser(user);
        verify(userOAuthRepository, times(1)).deleteAllByUser(user);
        verify(applicationRepository, times(1)).deleteAllByUser(user);
        verify(userRepository, times(1)).delete(user);
    }
}
