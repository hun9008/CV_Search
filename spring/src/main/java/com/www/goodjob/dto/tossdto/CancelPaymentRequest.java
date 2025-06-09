package com.www.goodjob.dto.tossdto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CancelPaymentRequest {
    private String paymentKey;
    private String cancelReason;

    public CancelPaymentRequest(String paymentKey, String cancelReason) {
        this.paymentKey = paymentKey;
        this.cancelReason = cancelReason;
    }
}
