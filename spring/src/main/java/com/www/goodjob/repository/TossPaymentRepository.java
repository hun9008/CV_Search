package com.www.goodjob.repository;

import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TossPaymentRepository extends JpaRepository<TossPayment, Long> {
    Optional<TossPayment> findByTossPaymentKey(String tossPaymentKey);
    void deleteAllByUser(User user);
}
