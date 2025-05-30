package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.dto.tossdto.ConfirmPaymentRequest;
import com.www.goodjob.dto.tossdto.CancelPaymentRequest;
import com.www.goodjob.dto.tossdto.TossPaymentResponseDto;
import com.www.goodjob.enums.TossPaymentMethod;
import com.www.goodjob.enums.TossPaymentStatus;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.TossPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class TossPaymentController {

    private final TossPaymentService tossPaymentService;
    private final ObjectMapper objectMapper;

    @Operation(
            summary = "Toss 결제 승인 처리",
            description = """
            ✅ Toss Payments 서버에 결제 승인 요청을 보냅니다.
            - 응답 status가 200이면 결제 완료로 간주
            - 사용자 정보와 함께 결제 내역 DB에 저장
            """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "결제 승인 성공 및 DB 저장 완료"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping("/confirm")
    @Transactional
    public ResponseEntity<?> confirm(@RequestBody ConfirmPaymentRequest req,
                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            var response = tossPaymentService.requestConfirm(req);
            if (response.statusCode() != 200) {
                return ResponseEntity.status(response.statusCode()).body(response.body());
            }

            JsonNode node = objectMapper.readTree(response.body().toString());

            TossPayment payment = TossPayment.builder()
                    .tossPaymentKey(node.get("paymentKey").asText())
                    .tossOrderId(node.get("orderId").asText())
                    .totalAmount(node.get("totalAmount").asLong())
                    .tossPaymentMethod(TossPaymentMethod.valueOf(node.get("method").asText()))
                    .tossPaymentStatus(TossPaymentStatus.valueOf(node.get("status").asText()))
                    .user(userDetails.getUser())
                    .build();

            tossPaymentService.savePayment(payment);
            return ResponseEntity.ok(TossPaymentResponseDto.from(payment));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @Operation(
            summary = "Toss 결제 취소",
            description = """
            ✅ 결제 승인 후 오류 발생 시, 또는 유저 요청에 의해 Toss에 결제 취소 요청을 보냅니다.
            - paymentKey와 취소 사유를 전달
            - 성공 시 결제 상태를 CANCELED로 업데이트
            """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "결제 취소 성공"),
            @ApiResponse(responseCode = "500", description = "결제 취소 처리 중 오류 발생")
    })
    @PostMapping("/cancel")
    public ResponseEntity<?> cancel(@RequestBody CancelPaymentRequest req) {
        try {
            var response = tossPaymentService.requestCancel(req);
            if (response.statusCode() == 200) {
                tossPaymentService.cancelStatusUpdate(req.getPaymentKey());
            }
            return ResponseEntity.status(response.statusCode()).body(response.body());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
