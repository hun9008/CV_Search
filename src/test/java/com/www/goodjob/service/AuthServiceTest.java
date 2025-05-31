package com.www.goodjob.service;

import com.www.goodjob.domain.User;
import com.www.goodjob.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private UserOAuthRepository userOAuthRepository;
    private SearchLogRepository searchLogRepository;
    private ApplicationRepository applicationRepository;
    private TossPaymentRepository tossPaymentRepository;
    private BookmarkRepository bookmarkRepository;
    private CvRepository cvRepository;
    private UserFeedbackRepository userFeedbackRepository;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userOAuthRepository = mock(UserOAuthRepository.class);
        searchLogRepository = mock(SearchLogRepository.class);
        applicationRepository = mock(ApplicationRepository.class);
        tossPaymentRepository = mock(TossPaymentRepository.class);
        bookmarkRepository = mock(BookmarkRepository.class);
        cvRepository = mock(CvRepository.class);
        userFeedbackRepository = mock(UserFeedbackRepository.class);

        authService = new AuthService(
                userRepository,
                userOAuthRepository,
                searchLogRepository,
                applicationRepository,
                tossPaymentRepository,
                bookmarkRepository,
                cvRepository,
                userFeedbackRepository
        );
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
        verify(tossPaymentRepository, times(1)).deleteAllByUser(user);
        verify(bookmarkRepository, times(1)).deleteAllByUser(user);
        verify(cvRepository, times(1)).deleteAllByUser(user);
        verify(userFeedbackRepository, times(1)).deleteAllByUser(user);
        verify(userRepository, times(1)).delete(user);
    }
}
