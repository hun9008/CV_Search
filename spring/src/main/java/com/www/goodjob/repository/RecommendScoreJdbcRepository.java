package com.www.goodjob.repository;

import com.www.goodjob.dto.ScoredJobDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class RecommendScoreJdbcRepository {

    private final JdbcTemplate jdbcTemplate;

    public void batchUpsert(Long cvId, List<ScoredJobDto> scores) {
        String sql = """
            INSERT INTO recommend_score (cv_id, job_id, score, created_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            score = VALUES(score)
        """;

        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                ScoredJobDto dto = scores.get(i);
                ps.setLong(1, cvId);
                ps.setLong(2, dto.getId());
                ps.setFloat(3, (float) dto.getScore());
            }

            @Override
            public int getBatchSize() {
                return scores.size();
            }
        });
    }
}