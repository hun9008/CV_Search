package com.www.goodjob.repository;

import com.www.goodjob.domain.RecommendScore;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.Cv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecommendScoreRepository extends JpaRepository<RecommendScore, Long> {
    Optional<RecommendScore> findByCvAndJob(Cv cv, Job job);
}
