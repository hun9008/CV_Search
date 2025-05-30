package com.www.goodjob.repository;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.www.goodjob.dto.ValidJobDto;
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

    @Query("SELECT DISTINCT j FROM Job j " +
            "LEFT JOIN FETCH j.jobRegions jr " +
            "LEFT JOIN FETCH jr.region " +
            "LEFT JOIN FETCH j.favicon " +
            "WHERE j.id IN :ids")
    List<Job> findByIdInWithRegion(@Param("ids") List<Long> ids);

    @Query("SELECT new com.www.goodjob.dto.ValidJobDto(" +
            "j.id, j.companyName, j.title, j.jobValidType, j.isPublic, j.createdAt, j.applyEndDate, j.url) " +
            "FROM Job j "
       )
    List<ValidJobDto> findAllWithValidType();

    long countByCreatedAtAfter(LocalDateTime date);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}

