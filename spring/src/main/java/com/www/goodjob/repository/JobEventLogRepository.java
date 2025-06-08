package com.www.goodjob.repository;

import com.www.goodjob.domain.JobEventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface JobEventLogRepository extends JpaRepository<JobEventLog, Long> {
    @Query("SELECT COUNT(e) FROM JobEventLog e WHERE e.event = 'impression' AND e.timestamp >= :start")
    long countImpressionsSince(@Param("start") LocalDateTime start);

    @Query("SELECT COUNT(e) FROM JobEventLog e WHERE e.event = 'click' AND e.timestamp >= :start")
    long countClicksSince(@Param("start") LocalDateTime start);

    @Query("SELECT COUNT(*) FROM JobEventLog e WHERE e.event = 'IMPRESSION' AND e.timestamp BETWEEN :start AND :end")
    long countImpressionsBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(*) FROM JobEventLog e WHERE e.event = 'CLICK' AND e.timestamp BETWEEN :start AND :end")
    long countClicksBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT e.userId) " +
            "FROM JobEventLog e " +
            "WHERE e.timestamp >= :start")
    long countActiveUsersSince(@Param("start") LocalDateTime start);
}
