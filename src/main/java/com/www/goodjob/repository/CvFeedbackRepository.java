package com.www.goodjob.repository;

import com.www.goodjob.domain.CvFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CvFeedbackRepository extends JpaRepository<CvFeedback, Long> {
    Optional<CvFeedback> findByRecommendScore_Id(Long recommendScoreId);
}
