package com.www.goodjob.dto.tossdto;

import com.www.goodjob.enums.TossPaymentPlan;

public record SaveAmountRequest(
        String orderId,
        String amount,
        TossPaymentPlan plan
) {}
