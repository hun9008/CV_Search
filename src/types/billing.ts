export interface billingType {
    currency: string;
    value: number;
}
export interface verifyResponse {
    code: number;
    message: string;
}

export interface amountType {
    orderId: string;
    amount: number;
}

export interface cancelPaymentsType {
    paymentKey: string;
    cancelReason: string;
}

export interface confirmPaymentsType {
    paymentKey: string;
    orderId: string;
    amount: number;
}
