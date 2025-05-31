package com.www.goodjob.service;

import com.www.goodjob.domain.User;
import com.www.goodjob.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserOAuthRepository userOAuthRepository;
    private final SearchLogRepository searchLogRepository;
    private final ApplicationRepository applicationRepository;
    private final TossPaymentRepository tossPaymentRepository;

    @Transactional
    public void withdraw(User user) {
        searchLogRepository.deleteAllByUser(user);
        userOAuthRepository.deleteAllByUser(user);
        applicationRepository.deleteAllByUser(user);
        tossPaymentRepository.deleteAllByUser(user);

        userRepository.delete(user);
    }
}
