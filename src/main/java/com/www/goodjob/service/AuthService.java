package com.www.goodjob.service;

import com.www.goodjob.domain.User;
import com.www.goodjob.repository.SearchLogRepository;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserOAuthRepository userOAuthRepository;
    private final SearchLogRepository searchLogRepository;

    @Transactional
    public void withdraw(User user) {
        searchLogRepository.deleteAllByUser(user);
        userOAuthRepository.deleteAllByUser(user);
        userRepository.delete(user);
    }
}
