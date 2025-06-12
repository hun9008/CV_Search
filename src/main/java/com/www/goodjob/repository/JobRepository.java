package com.www.goodjob.repository;

import com.www.goodjob.domain.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.www.goodjob.dto.JobWithValidTypeDto;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    @Query(value = """
    SELECT DISTINCT j FROM Job j
    LEFT JOIN FETCH j.favicon f
    WHERE j.isPublic = true
    AND (
        :keyword IS NULL OR
        LOWER(j.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.department) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.experience) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.jobDescription) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.jobType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.preferredQualifications) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.idealCandidate) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.requirements) LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
    AND (:jobTypes IS NULL OR j.jobType IN :jobTypes)
    AND (:experiences IS NULL OR j.experience IN :experiences)
    AND (
        (:sidos IS NULL AND :sigungus IS NULL)
        OR EXISTS (
            SELECT 1 FROM JobRegion jr2
            WHERE jr2.job = j
            AND (:sidos IS NULL OR jr2.region.sido IN :sidos)
            AND (:sigungus IS NULL OR jr2.region.sigungu IN :sigungus)
        )
    )
    """,
            countQuery = """
    SELECT COUNT(DISTINCT j.id) FROM Job j
    LEFT JOIN  j.jobRegions jr
    LEFT JOIN  jr.region r
    WHERE j.isPublic = true
    AND (
        :keyword IS NULL OR
        LOWER(j.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.department) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.experience) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.jobDescription) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.jobType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.preferredQualifications) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.idealCandidate) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(j.requirements) LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
    AND (:jobTypes IS NULL OR j.jobType IN :jobTypes)
    AND (:experiences IS NULL OR j.experience IN :experiences)
    AND (
        (:sidos IS NULL AND :sigungus IS NULL)
        OR EXISTS (
            SELECT 1 FROM JobRegion jr2
            WHERE jr2.job = j
            AND (:sidos IS NULL OR jr2.region.sido IN :sidos)
            AND (:sigungus IS NULL OR jr2.region.sigungu IN :sigungus)
        )
    )
    """
    )
    @EntityGraph(value = "Job.withJobRegionsAndRegion")
    Page<Job> searchJobsWithFilters(
            @Param("keyword") String keyword,
            @Param("jobTypes") List<String> jobTypes,
            @Param("experiences") List<String> experiences,
            @Param("sidos") List<String> sidos,
            @Param("sigungus") List<String> sigungus,
            Pageable pageable
    );


    @Query(value = """
SELECT j FROM Job j
WHERE j.isPublic = true
AND (:jobTypes IS NULL OR j.jobType IN :jobTypes)
AND (:experiences IS NULL OR j.experience IN :experiences)
AND (
    (:sidos IS NULL AND :sigungus IS NULL)
    OR EXISTS (
        SELECT 1 FROM JobRegion jr
        WHERE jr.job = j
        AND (:sidos IS NULL OR jr.region.sido IN :sidos)
        AND (:sigungus IS NULL OR jr.region.sigungu IN :sigungus)
    )
)
""",
            countQuery = """
SELECT COUNT(j.id) FROM Job j
WHERE j.isPublic = true
AND (:jobTypes IS NULL OR j.jobType IN :jobTypes)
AND (:experiences IS NULL OR j.experience IN :experiences)
AND (
    (:sidos IS NULL AND :sigungus IS NULL)
    OR EXISTS (
        SELECT 1 FROM JobRegion jr
        WHERE jr.job = j
        AND (:sidos IS NULL OR jr.region.sido IN :sidos)
        AND (:sigungus IS NULL OR jr.region.sigungu IN :sigungus)
    )
)
"""
    )
    @EntityGraph(value = "Job.withJobRegionsAndRegion") // 이 부분을 추가!
    Page<Job> searchJobsWithFiltersWithOutKeyword(
            @Param("jobTypes") List<String> jobTypes,
            @Param("experiences") List<String> experiences,
            @Param("sidos") List<String> sidos,
            @Param("sigungus") List<String> sigungus,
            Pageable pageable
    );

    @Query("SELECT DISTINCT j FROM Job j " +
            "LEFT JOIN FETCH j.jobRegions jr " +
            "LEFT JOIN FETCH jr.region " +
            "LEFT JOIN FETCH j.favicon " +
            "WHERE j.id IN :ids")
    List<Job> findByIdInWithRegion(@Param("ids") List<Long> ids);


    long countByCreatedAtAfter(LocalDateTime date);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}

