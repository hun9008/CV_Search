package com.www.goodjob.dto.tossdto;

import lombok.Getter;

@Getter
public class ConfirmPaymentRequest {
    private String paymentKey;
    private String orderId;
    private Long amount;
}
