package com.www.goodjob.repository;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    @Query("SELECT DISTINCT j FROM Job j " +
            "LEFT JOIN FETCH j.jobRegions jr " +
            "LEFT JOIN FETCH jr.region r " +
            "WHERE j.isPublic = true AND (" +
            "(:keyword IS NULL OR " +
            "LOWER(j.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.department) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.experience) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.jobDescription) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.jobType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.preferredQualifications) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.idealCandidate) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.requirements) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    List<Job> searchJobsWithRegion(@Param("keyword") String keyword, Sort sort);

//    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.region WHERE j.id = :id")
//    Optional<Job> findByIdWithRegion(@Param("id") Long id);
//
//    @Query("SELECT DISTINCT j FROM Job j LEFT JOIN FETCH j.region WHERE j.id IN :ids")
//    List<Job> findByIdInWithRegion(@Param("ids") List<Long> ids);

    // job_region 테이블 추가로 인해 쿼리 수정
    @Query("SELECT DISTINCT j FROM Job j " +
            "LEFT JOIN FETCH j.jobRegions jr " +
            "LEFT JOIN FETCH jr.region " +
            "WHERE j.id = :id")
    Optional<Job> findByIdWithRegion(@Param("id") Long id);

    @Query("SELECT DISTINCT j FROM Job j " +
            "LEFT JOIN FETCH j.jobRegions jr " +
            "LEFT JOIN FETCH jr.region " +
            "WHERE j.id IN :ids")
    List<Job> findByIdInWithRegion(@Param("ids") List<Long> ids);

    @Query("SELECT DISTINCT j FROM Job j " +
            "LEFT JOIN FETCH j.jobRegions jr " +
            "LEFT JOIN FETCH jr.region " +
            "LEFT JOIN FETCH j.jobValidType "
                )
    List<Job> findAllWithValidType();

    long countByCreatedAtAfter(LocalDateTime date);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}

