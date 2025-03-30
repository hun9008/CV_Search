package com.www.goodjob.repository;

import com.www.goodjob.domain.UserOAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserOAuthRepository extends JpaRepository<UserOAuth, Long> {
    // User 엔티티의 email 필드를 기준으로 조회
    Optional<UserOAuth> findByUser_Email(String email);
}
