package com.www.goodjob.repository;

import com.www.goodjob.domain.SearchLog;
import com.www.goodjob.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {
    List<SearchLog> findTop10ByUserOrderByCreatedAtDesc(User user);
    SearchLog findTop1ByUserOrderByCreatedAtDesc(User user);
    void deleteAllByUser(User user);
    void deleteByUserAndKeyword(User user, String keyword);
}
