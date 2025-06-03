package com.www.goodjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.tossdto.ConfirmPaymentRequest;
import com.www.goodjob.dto.tossdto.CancelPaymentRequest;
import com.www.goodjob.enums.TossPaymentMethod;
import com.www.goodjob.enums.TossPaymentPlan;
import com.www.goodjob.enums.TossPaymentStatus;
import com.www.goodjob.repository.TossPaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public TossPayment handlePaymentConfirmation(JsonNode node, User user) {
        TossPayment payment = TossPayment.builder()
                .tossPaymentKey(node.get("paymentKey").asText())
                .tossOrderId(node.get("orderId").asText())
                .totalAmount(node.get("totalAmount").asLong())
                .tossPaymentMethod(TossPaymentMethod.valueOf(node.get("method").asText()))
                .tossPaymentStatus(TossPaymentStatus.valueOf(node.get("status").asText()))
                .tossPaymentPlan(TossPaymentPlan.베이직)
                .user(user)
                .build();

        tossPaymentRepository.save(payment);
        updateUserPlan(user, TossPaymentPlan.베이직);
        return payment;
    }

    public void updateUserPlan(User user, TossPaymentPlan plan) {
        user.setPlan(plan);
    }
}
