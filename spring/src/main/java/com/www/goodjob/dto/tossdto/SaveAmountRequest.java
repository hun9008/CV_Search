package com.www.goodjob.dto.tossdto;

public record SaveAmountRequest(
        String orderId,
        long amount
) {}