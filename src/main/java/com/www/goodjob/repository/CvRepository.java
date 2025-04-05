package com.www.goodjob.repository;

import com.www.goodjob.domain.Cv;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CvRepository extends JpaRepository<Cv, Long> {
}
