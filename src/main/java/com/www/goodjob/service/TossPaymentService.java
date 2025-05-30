package com.www.goodjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.dto.tossdto.ConfirmPaymentRequest;
import com.www.goodjob.dto.tossdto.CancelPaymentRequest;
import com.www.goodjob.enums.TossPaymentStatus;
import com.www.goodjob.repository.TossPaymentRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class TossPaymentService {

    private final TossPaymentRepository tossPaymentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${toss.secret-key}")
    private String secretKey;

    @PostConstruct
    public void init() {
        System.out.println("✅ Loaded Toss Secret Key: " + secretKey);
    }

    public HttpResponse requestConfirm(ConfirmPaymentRequest req) throws Exception {
        JsonNode requestObj = objectMapper.createObjectNode()
                .put("orderId", req.getOrderId())
                .put("amount", req.getAmount())
                .put("paymentKey", req.getPaymentKey());

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.tosspayments.com/v1/payments/confirm"))
                .header("Authorization", getAuthorization())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestObj.toString()))
                .build();

        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }

    public HttpResponse requestCancel(CancelPaymentRequest req) throws Exception {
        String body = String.format("{\"cancelReason\":\"%s\"}", req.getCancelReason());

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.tosspayments.com/v1/payments/" + req.getPaymentKey() + "/cancel"))
                .header("Authorization", getAuthorization())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }

    private String getAuthorization() {
        // TossPayments 시크릿 키를 Base64로 인코딩하여 Basic 인증 헤더 생성
        Base64.Encoder encoder = Base64.getEncoder();
        byte[] encodedBytes = encoder.encode((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        return "Basic " + new String(encodedBytes);
    }

    public void savePayment(TossPayment payment) {
        tossPaymentRepository.save(payment);
    }

    public void cancelStatusUpdate(String paymentKey) {
        tossPaymentRepository.findByTossPaymentKey(paymentKey).ifPresent(payment -> {
            payment.setTossPaymentStatus(TossPaymentStatus.CANCELED);
            tossPaymentRepository.save(payment);
        });
    }
}
