package com.www.goodjob.repository;

import com.www.goodjob.domain.UserOAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserOAuthRepository extends JpaRepository<UserOAuth, Long> {
}
