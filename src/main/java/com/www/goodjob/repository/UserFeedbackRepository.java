package com.www.goodjob.repository;


import com.www.goodjob.domain.UserFeedback;
import com.www.goodjob.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserFeedbackRepository extends JpaRepository<UserFeedback, Long> {

    List<UserFeedback> findByUser(User user);

    List<UserFeedback> findByContentContaining(String keyword);

    List<UserFeedback> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT AVG(f.satisfactionScore) FROM UserFeedback f")
    Double getAverageSatisfactionScore();

    @Query("SELECT COUNT(f) FROM UserFeedback f")
    Long countTotalFeedback();

    void deleteAllByUser(User user);
}