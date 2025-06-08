package com.www.goodjob.repository;

import com.www.goodjob.domain.User;
import com.www.goodjob.domain.UserOAuth;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserOAuthRepository extends JpaRepository<UserOAuth, Long> {
    void deleteAllByUser(User user);
}
