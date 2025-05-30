package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.dto.tossdto.ConfirmPaymentRequest;
import com.www.goodjob.dto.tossdto.CancelPaymentRequest;
import com.www.goodjob.dto.tossdto.SaveAmountRequest;
import com.www.goodjob.dto.tossdto.PaymentErrorResponse;
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
import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class TossPaymentController {

    private final TossPaymentService tossPaymentService;
    private final ObjectMapper objectMapper;

    @Operation(
            summary = "결제 금액 임시 저장",
            description = """
            ✅ 결제 전 `orderId`에 대한 금액을 세션에 임시 저장합니다.
            
            - 이후 결제 검증 시 금액 위변조 여부를 확인하기 위함
            - 프론트에서 TossPay 결제 직전 호출
            """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "임시 저장 성공")
    })
    @PostMapping("/saveAmount")
    public ResponseEntity<?> tempsave(HttpSession session, @RequestBody SaveAmountRequest saveAmountRequest) {
        session.setAttribute(saveAmountRequest.getOrderId(), saveAmountRequest.getAmount());
        return ResponseEntity.ok("Payment temp save successful");
    }

    @Operation(
            summary = "결제 금액 검증",
            description = """
            ✅ Toss 결제 승인 전, 금액이 위변조되지 않았는지 검증합니다.
            
            - 세션에 저장된 금액과 비교하여 일치하지 않으면 결제 진행 차단
            """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "검증 성공"),
            @ApiResponse(responseCode = "400", description = "결제 금액이 일치하지 않음 (위변조 가능성)")
    })
    @PostMapping("/verifyAmount")
    public ResponseEntity<?> verifyAmount(HttpSession session, @RequestBody SaveAmountRequest saveAmountRequest) {
        Long amount = (Long) session.getAttribute(saveAmountRequest.getOrderId());

        if (amount == null || !amount.equals(saveAmountRequest.getAmount())) {
            return ResponseEntity.badRequest().body(
                    PaymentErrorResponse.builder()
                            .code(400)
                            .message("결제 금액 정보가 유효하지 않습니다.")
                            .build()
            );
        }

        session.removeAttribute(saveAmountRequest.getOrderId());
        return ResponseEntity.ok("Payment is valid");
    }

    @Operation(
            summary = "Toss 결제 승인 처리",
            description = """
            ✅ Toss Payments 서버에 결제 승인 요청을 보냅니다.
            
            - 응답 status가 200이면 결제 완료로 간주
            - 사용자 정보와 함께 결제 내역 DB에 저장
            - 실패 시 내부 오류로 응답
            """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "결제 승인 성공 및 DB 저장 완료"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자 (accessToken 누락 또는 만료)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping("/confirm")
    @Transactional
    public ResponseEntity<?> confirm(@RequestBody ConfirmPaymentRequest req, @AuthenticationPrincipal CustomUserDetails userDetails) {
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
                    .requestedAt(LocalDateTime.parse(node.get("requestedAt").asText()))
                    .approvedAt(LocalDateTime.parse(node.get("approvedAt").asText()))
                    .user(userDetails.getUser())
                    .build();

            tossPaymentService.savePayment(payment);
            return ResponseEntity.ok(payment);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @Operation(
            summary = "Toss 결제 취소",
            description = """
            ✅ 결제 승인 후, DB 저장 실패 또는 유저 취소 요청 시 Toss에 결제 취소 요청을 보냅니다.
            
            - paymentKey와 취소 사유(cancelReason)를 전달
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
