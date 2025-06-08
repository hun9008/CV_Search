package com.www.goodjob.repository;

import com.www.goodjob.domain.RecommendScore;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.Cv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecommendScoreRepository extends JpaRepository<RecommendScore, Long> {
    Optional<RecommendScore> findByCvAndJob(Cv cv, Job job);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO recommend_score (cv_id, job_id, score, created_at)
        VALUES (:cvId, :jobId, :score, NOW())
        ON DUPLICATE KEY UPDATE
        score = :score
    """, nativeQuery = true)
    void upsertScore(@Param("cvId") Long cvId, @Param("jobId") Long jobId, @Param("score") float score);

    @Query("""
    SELECT r FROM RecommendScore r
    WHERE r.cv.id = :cvId AND r.job.id IN :jobIds
""")
    List<RecommendScore> findByCvIdAndJobIdIn(@Param("cvId") Long cvId, @Param("jobIds") List<Long> jobIds);

    @Query("""
            SELECT r FROM RecommendScore r
            WHERE r.cv.id = :cvId AND r.job.id = :jobId
            """)
    RecommendScore findByCvIdAndJobId(@Param("cvId") Long cvId, @Param("jobId") Long jobId);

    @Modifying
    @Query("DELETE FROM RecommendScore r WHERE r.cv.id = :cvId")
    void deleteByCvId(@Param("cvId") Long cvId);
}
