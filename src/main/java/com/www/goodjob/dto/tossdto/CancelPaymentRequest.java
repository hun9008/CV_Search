package com.www.goodjob.dto.tossdto;

import lombok.Getter;

@Getter
public class CancelPaymentRequest {
    private String paymentKey;
    private String cancelReason;
}