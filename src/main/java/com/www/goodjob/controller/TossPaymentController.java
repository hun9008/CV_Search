package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.dto.tossdto.*;
import com.www.goodjob.enums.TossPaymentPlan;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.TossPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class TossPaymentController {

    private final TossPaymentService tossPaymentService;
    private final ObjectMapper objectMapper;

    @Operation(
            summary = "Toss 결제 승인 처리",
            description = """
                    ✅ 결제 완료 후 Toss에서 반환한 paymentKey, orderId, amount를 이용해 결제 승인 요청을 보냅니다.
                    
                    - 이 API는 결제를 실제로 승인 처리하며, 결제 내역을 DB에 저장합니다.
                    - 결제 금액은 세션에 임시 저장된 값과 비교해 위·변조 여부를 검증합니다.
                    - 검증이 완료되면 유저의 플랜을 `베이직`으로 업그레이드합니다.
                    
                    [프론트 예시]
                    - 결제금액: 1000
                    - 주문번호(orderId): MC42NzczMDM0OTU5MDAz
                    - paymentKey: tgen_20250531014324brek6
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "결제 승인 성공 및 DB 저장 완료"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping("/confirm")
    public ResponseEntity<?> confirm(@RequestBody ConfirmPaymentRequest req,
                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            var response = tossPaymentService.requestConfirm(req);
            if (response.statusCode() != 200) {
                return ResponseEntity.status(response.statusCode()).body(response.body());
            }

            JsonNode node = objectMapper.readTree(response.body().toString());

            TossPayment payment = tossPaymentService.handlePaymentConfirmation(node, userDetails.getUser());

            return ResponseEntity.ok(TossPaymentResponseDto.from(payment));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @Operation(
            summary = "Toss 결제 취소",
            description = """
                    ✅ 결제 승인 이후 오류가 발생했거나 사용자가 결제를 취소하고자 할 때 사용합니다.
                    
                    - Toss로 paymentKey와 취소 사유를 함께 전달합니다.
                    - Toss 결제 상태가 "CANCELED"로 변경됩니다.
                    
                    [예시]
                    - paymentKey: tgen_20250531014324brek6
                    - cancelReason: 사용자 요청으로 인한 취소
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

    @Operation(
            summary = "결제 금액 임시 저장",
            description = """
                    ✅ 결제 요청 전에 orderId와 결제 금액을 세션에 저장합니다.
                    
                    - 결제 금액 위·변조 방지를 위해 세션 기반으로 금액을 저장합니다.
                    - 인증된 사용자만 접근 가능하며, 사용자별 세션으로 격리됩니다.
                    
                    [예시 요청]
                    - orderId: MC42NzczMDM0OTU5MDAz
                    - amount: 1000
                    
                    [성공 응답]
                    - HTTP 200 OK
                    - Body: "Payment temp save successful"
                    """
    )
    @PostMapping("/saveAmount")
    public ResponseEntity<?> tempsave(HttpSession session,
                                      @RequestBody SaveAmountRequest req,
                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 로그 기록
        log.info("임시 결제 저장 - userId={}, orderId={}, amount={}",
                userDetails.getUser().getId(), req.orderId(), req.amount());

        session.setAttribute(req.orderId(), req.amount());
        return ResponseEntity.ok("Payment temp save successful");
    }

    @Operation(
            summary = "결제 금액 검증",
            description = """
                    ✅ 결제 승인 전에 세션에 저장된 금액과 실제 결제 금액이 일치하는지 확인합니다.
                    
                    - 다르면 악의적인 조작으로 간주하고 결제를 거부합니다.
                    - 검증 완료 시 해당 세션 정보는 삭제됩니다.
                    
                    [예시 요청]
                    - orderId: MC42NzczMDM0OTU5MDAz
                    - amount: 1000
                    
                    [성공 응답]
                    - HTTP 200 OK
                    - Body: "Payment is valid"
                    
                    [실패 응답]
                    - HTTP 400 Bad Request
                    - Body:
                      {
                        "code": 400,
                        "message": "결제 금액 정보가 유효하지 않습니다."
                      }
                    """
    )
    @PostMapping("/verifyAmount")
    public ResponseEntity<?> verifyAmount(HttpSession session,
                                          @RequestBody SaveAmountRequest req,
                                          @AuthenticationPrincipal CustomUserDetails userDetails) {
        String storedAmount = (String) session.getAttribute(req.orderId()); // 여기서 왜 orderId를 가져오는 거야?? amount 아님?

        if (storedAmount == null || !storedAmount.equals(req.amount())) {
            return ResponseEntity.badRequest()
                    .body(PaymentErrorResponse.builder()
                            .code(400)
                            .message("결제 금액 정보가 유효하지 않습니다.")
                            .build());
        }

        session.removeAttribute(req.orderId());
        return ResponseEntity.ok("Payment is valid");
    }

    @Operation(
            summary = "사용자 결제 플랜 조회",
            description = """
                ✅ 로그인된 사용자의 현재 결제 플랜을 조회합니다.
                
                - 회원가입 시 기본 플랜은 '스타터'입니다.
                - 결제 완료 시 '베이직'으로 변경됩니다.
                
                [성공 응답 예시]
                {
                  "plan": "베이직"
                }
                """
    )
    @GetMapping("/plan")
    public ResponseEntity<?> getUserPlan(@AuthenticationPrincipal CustomUserDetails userDetails) {
        TossPaymentPlan plan = userDetails.getUser().getPlan();
        return ResponseEntity.ok(Map.of("plan", plan.name()));
    }
}
