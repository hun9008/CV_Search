package com.www.goodjob.repository;

import com.www.goodjob.domain.Application;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByUser(User user);
    Optional<Application> findByUserAndJob(User user, Job job);
}
