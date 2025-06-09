package com.www.goodjob.dto.tossdto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ConfirmPaymentRequest {
    private String paymentKey;
    private String orderId;
    private Long amount;

    public ConfirmPaymentRequest(String paymentKey, String orderId, Long amount) {
        this.paymentKey = paymentKey;
        this.orderId = orderId;
        this.amount = amount;
    }
}
