package com.www.goodjob.repository;

import com.www.goodjob.domain.JobValidType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

@Repository
public interface JobValidTypeRepository  extends JpaRepository<JobValidType, Long> {

    @Modifying
    @Transactional
    @Query(value = """
    INSERT INTO job_valid_type (job_id, valid_type)
    VALUES (:jobId, :validType)
    ON DUPLICATE KEY UPDATE valid_type = VALUES(valid_type)
    """, nativeQuery = true)
    void upsertJobValidType(@Param("jobId") Long jobId, @Param("validType") int validType);
}
