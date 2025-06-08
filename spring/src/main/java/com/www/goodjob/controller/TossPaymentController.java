package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.tossdto.*;
import com.www.goodjob.enums.TossPaymentPlan;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.TossPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class TossPaymentController {

    private final TossPaymentService tossPaymentService;
    private final UserRepository userRepository;
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
            if (payment == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Toss 결제 응답이 없습니다.");
            }

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

        Object storedObj = session.getAttribute(req.orderId());

        if (!(storedObj instanceof Long storedAmount)) {
            log.warn("검증 실패 - 세션에 저장된 금액이 없음 또는 타입 불일치. userId={}, orderId={}, storedObj={}",
                    userDetails.getUser().getId(), req.orderId(), storedObj);
            return ResponseEntity.badRequest()
                    .body(PaymentErrorResponse.builder()
                            .code(400)
                            .message("결제 금액 정보가 유효하지 않습니다.")
                            .build());
        }

        if (storedAmount != req.amount()) {
            log.warn("검증 실패 - 세션 금액과 요청 금액 불일치. userId={}, orderId={}, storedAmount={}, requestedAmount={}",
                    userDetails.getUser().getId(), req.orderId(), storedAmount, req.amount());
            return ResponseEntity.badRequest()
                    .body(PaymentErrorResponse.builder()
                            .code(400)
                            .message("결제 금액 정보가 유효하지 않습니다.")
                            .build());
        }

        session.removeAttribute(req.orderId());
        log.info("검증 성공 - userId={}, orderId={}, amount={}", userDetails.getUser().getId(), req.orderId(), storedAmount);
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
        Long userId = userDetails.getUser().getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TossPaymentPlan plan = user.getPlan();
        return ResponseEntity.ok(Map.of("plan", plan.name()));
    }

    @Operation(
            summary = "결제 플랜 구독 취소 (베이직 → 스타터)",
            description = """
                    ✅ 현재 사용자의 플랜을 '베이직'에서 '스타터'로 강제 변경합니다.
                    
                    - 일반적으로 구독 해지나 기간 만료 시 사용합니다.
                    - 변경된 플랜은 즉시 DB에 반영됩니다.
                    
                    [성공 응답 예시]
                    {
                      "message": "플랜이 스타터로 변경되었습니다.",
                      "plan": "스타터"
                    }
                    
                    - 확장 가능성
                    - 1. 구독 만료일 자동 계산 후 @Scheduled로 주기적 플랜 변경
                    - 2. 관리자 권한으로 플랜 강제 변경 API (PATCH /admin/users/{id}/plan 등)
                    """
    )
    @PostMapping("/cancelPlan")
    public ResponseEntity<?> cancelPlan(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPlan(TossPaymentPlan.스타터);
        userRepository.save(user);

        log.info("[플랜 취소] userId={}, 변경 플랜={}", userId, user.getPlan());

        return ResponseEntity.ok(Map.of(
                "message", "플랜이 스타터로 변경되었습니다.",
                "plan", user.getPlan().name()
        ));
    }

}
