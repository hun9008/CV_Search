package com.www.goodjob.dto.tossdto;

import lombok.Getter;

@Getter
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
