package com.www.goodjob.repository;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.JobRegion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobRegionRepository extends JpaRepository<JobRegion, Long>{

}
