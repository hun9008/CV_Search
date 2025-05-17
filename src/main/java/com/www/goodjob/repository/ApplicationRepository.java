package com.www.goodjob.repository;

import com.www.goodjob.domain.Application;
import com.www.goodjob.domain.User;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Application + Job 을 한 번의 쿼리로 가져옴
    @Query("SELECT a FROM Application a JOIN FETCH a.job WHERE a.user = :user")
    List<Application> findByUser(@Param("user") User user);

    Optional<Application> findById(Long id);

    boolean existsByUserIdAndJobId(Long userId, Long jobId);
    Optional<Application> findByUserIdAndJobId(Long userId, Long jobId);

}
