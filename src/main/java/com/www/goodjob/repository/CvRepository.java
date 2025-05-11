package com.www.goodjob.repository;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CvRepository extends JpaRepository<Cv, Long> {
    Optional<Cv> findByUserId(Long userId);
    Optional<Cv> findTopByUserIdOrderByUploadedAtDesc(Long userId);
    Optional<Cv> findByUser(User user);
    Optional<Cv> findByUserAndFileName(User user, String fileName);
}
