package com.www.goodjob.dto.tossdto;

import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.enums.TossPaymentMethod;
import com.www.goodjob.enums.TossPaymentStatus;
import lombok.Builder;

@Builder
public record TossPaymentResponseDto(
        String tossPaymentKey,
        String tossOrderId,
        long totalAmount,
        TossPaymentMethod tossPaymentMethod,
        TossPaymentStatus tossPaymentStatus
) {
    public static TossPaymentResponseDto from(TossPayment payment) {
        return TossPaymentResponseDto.builder()
                .tossPaymentKey(payment.getTossPaymentKey())
                .tossOrderId(payment.getTossOrderId())
                .totalAmount(payment.getTotalAmount())
                .tossPaymentMethod(payment.getTossPaymentMethod())
                .tossPaymentStatus(payment.getTossPaymentStatus())
                .build();
    }
}
