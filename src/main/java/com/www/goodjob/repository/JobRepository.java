package com.www.goodjob.repository;

import com.www.goodjob.domain.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    @Query("SELECT j FROM Job j WHERE j.isPublic = true " +
            "AND (:keyword IS NULL OR LOWER(j.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:jobType IS NULL OR j.jobType = :jobType) " +
            "AND (:department IS NULL OR j.department = :department)")
    Page<Job> searchJobs(
            @Param("keyword") String keyword,
            @Param("jobType") String jobType,
            @Param("department") String department,
            Pageable pageable
    );
}
