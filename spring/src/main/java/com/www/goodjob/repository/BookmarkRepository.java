package com.www.goodjob.repository;

import com.www.goodjob.domain.Bookmark;
import com.www.goodjob.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    boolean existsByUserIdAndJobId(Long userId, Long jobId);
    Optional<Bookmark> findByUserIdAndJobId(Long userId, Long jobId);
    List<Bookmark> findAllByUser(User user);
    void deleteAllByUser(User user);
}
