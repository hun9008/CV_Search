package com.www.goodjob.dto.tossdto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentErrorResponse {
    private int code;
    private String message;
}