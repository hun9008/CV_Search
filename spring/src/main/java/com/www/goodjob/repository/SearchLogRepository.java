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

    @Query(value = """
            SELECT s.keyword, s.created_at 
            FROM search_log s
            INNER JOIN (
                SELECT keyword, MAX(created_at) AS max_created_at
                FROM search_log
                WHERE user_id = :userId
                GROUP BY keyword
            ) latest ON s.keyword = latest.keyword AND s.created_at = latest.max_created_at
            WHERE s.user_id = :userId
            ORDER BY s.created_at DESC
            LIMIT 10
            """, nativeQuery = true)
    List<Object[]> findDistinctRecentKeywordsByUser(Long userId);

}
