package com.www.goodjob.repository;

import com.www.goodjob.domain.CvFeedback;
import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CvFeedbackRepository extends JpaRepository<CvFeedback, Long> {
    Optional<CvFeedback> findByCvAndJob(Cv cv, Job job);
}
