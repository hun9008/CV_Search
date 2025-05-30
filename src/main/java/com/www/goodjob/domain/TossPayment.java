package com.www.goodjob.domain;

import com.www.goodjob.enums.TossPaymentMethod;
import com.www.goodjob.enums.TossPaymentStatus;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TossPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tossPaymentKey; // Toss Payments에서 제공하는 결제에 대한 식별 값

    @Column(nullable = false)  // // 토스내부에서 관리하는 별도의 orderId가 존재함
    private String tossOrderId; // 프론트에서 지정한 orderId

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private long totalAmount; // 총 결제 금액

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TossPaymentMethod tossPaymentMethod; // 결제 방식

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TossPaymentStatus tossPaymentStatus; // 결제 상태

}
