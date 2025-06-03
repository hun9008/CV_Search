package com.www.goodjob.dto.tossdto;

import lombok.Getter;

@Getter
public class CancelPaymentRequest {
    private String paymentKey;
    private String cancelReason;

    public CancelPaymentRequest(String paymentKey, String cancelReason) {
        this.paymentKey = paymentKey;
        this.cancelReason = cancelReason;
    }
}
