package com.www.goodjob.repository;

import com.www.goodjob.domain.SearchLog;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.KeywordCount;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {
    List<SearchLog> findTop10ByUserOrderByCreatedAtDesc(User user);
    SearchLog findTop1ByUserOrderByCreatedAtDesc(User user);
    void deleteAllByUser(User user);
    void deleteByUserAndKeyword(User user, String keyword);

    @Query("SELECT new com.www.goodjob.dto.KeywordCount(s.keyword, COUNT(s)) " +
            "FROM SearchLog s " +
            "WHERE s.keyword IS NOT NULL " +
            "GROUP BY s.keyword " +
            "ORDER BY COUNT(s) DESC")
    List<KeywordCount> findTopKeywords(Pageable pageable);
}
