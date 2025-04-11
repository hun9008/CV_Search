package com.www.goodjob.repository;

import com.www.goodjob.domain.JobUpdateStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JobUpdateStatusRepository extends JpaRepository<JobUpdateStatus, Long> {
    Optional<JobUpdateStatus> findTopByOrderByRequestedAtDesc();
}
