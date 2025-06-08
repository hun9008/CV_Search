package com.www.goodjob.repository;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CvRepository extends JpaRepository<Cv, Long> {
    Optional<Cv> findByUserId(Long userId);
    List<Cv> findAllByUserId(Long userId);
    List<Cv> findAllByUser(User user);
    Optional<Cv> findTopByUserIdOrderByUploadedAtDesc(Long userId);
//    Optional<Cv> findByUser(User user);
    boolean existsByUserIdAndFileName(Long userId, String fileName);
    Optional<Cv> findByUserIdAndFileName(Long userId, String fileName);

    void deleteAllByUser(User user);
}
