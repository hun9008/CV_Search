package com.www.goodjob.dto;

import lombok.Getter;

@Getter
public class ConfirmPaymentRequest {
    private String paymentKey;
    private String orderId;
    private String amount;
}
