package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.config.GlobalMockBeans;
import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.tossdto.CancelPaymentRequest;
import com.www.goodjob.dto.tossdto.ConfirmPaymentRequest;
import com.www.goodjob.dto.tossdto.SaveAmountRequest;
import com.www.goodjob.enums.TossPaymentPlan;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.TossPaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.net.http.HttpResponse;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TossPaymentController.class)
@Import(GlobalMockBeans.class)
public class TossPaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TossPaymentService tossPaymentService;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserRepository userRepository;

    private MockHttpSession session;

    @BeforeEach
    void setup() {
        User user = User.builder()
                .id(1L)
                .email("test@goodjob.com")
                .plan(TossPaymentPlan.스타터)
                .build();

        CustomUserDetails customUserDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        session = new MockHttpSession();
        session.setAttribute("SPRING_SECURITY_CONTEXT", context);
    }

    @Test
    @DisplayName("/payments/confirm - 결제 승인 전체 흐름")
    void confirmPayment() throws Exception {
        TossPayment payment = TossPayment.builder()
                .tossPaymentKey("payKey123")
                .tossOrderId("order001")
                .totalAmount(1000L)
                .build();

        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn("{\"paymentKey\":\"payKey123\",\"orderId\":\"order001\",\"amount\":1000}");

        when(tossPaymentService.requestConfirm(any())).thenReturn(mockResponse);
        when(tossPaymentService.handlePaymentConfirmation(any(), any())).thenReturn(payment);

        ConfirmPaymentRequest request = new ConfirmPaymentRequest("payKey123", "order001", 1000L);

        mockMvc.perform(post("/payments/confirm")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("/payments/confirm - Toss 응답 실패 시 상태코드 그대로 반환")
    void confirmPayment_failResponse() throws Exception {
        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(400);
        when(mockResponse.body()).thenReturn("INVALID_PAYMENT");

        when(tossPaymentService.requestConfirm(any())).thenReturn(mockResponse);

        ConfirmPaymentRequest request = new ConfirmPaymentRequest("payKey123", "order001", 1000L);

        mockMvc.perform(post("/payments/confirm")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is(400));
    }

    @Test
    @DisplayName("/payments/confirm - handlePaymentConfirmation에서 null 반환 시 500")
    void confirmPayment_nullPayment() throws Exception {
        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn("{\"paymentKey\":\"payKey123\",\"orderId\":\"order001\",\"amount\":1000}");

        when(tossPaymentService.requestConfirm(any())).thenReturn(mockResponse);
        when(tossPaymentService.handlePaymentConfirmation(any(), any())).thenReturn(null); // 👈 null 반환 시뮬레이션

        ConfirmPaymentRequest request = new ConfirmPaymentRequest("payKey123", "order001", 1000L);

        mockMvc.perform(post("/payments/confirm")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }


    @Test
    @DisplayName("/payments/verifyAmount - 세션 금액 검증 성공")
    void verifyAmountSuccess() throws Exception {
        SaveAmountRequest request = new SaveAmountRequest("order001", 1000L);
        session.setAttribute("order001", 1000L);

        mockMvc.perform(post("/payments/verifyAmount")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("/payments/cancel - 결제 취소 흐름")
    void cancelPayment() throws Exception {
        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(tossPaymentService.requestCancel(any())).thenReturn(mockResponse);

        CancelPaymentRequest request = new CancelPaymentRequest("payKey123", "사용자 요청");

        mockMvc.perform(post("/payments/cancel")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("/payments/cancel - Toss 응답 실패 시 그대로 반환")
    void cancelPayment_fail() throws Exception {
        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(400);
        when(mockResponse.body()).thenReturn("CANCEL_FAILED");

        when(tossPaymentService.requestCancel(any())).thenReturn(mockResponse);

        CancelPaymentRequest request = new CancelPaymentRequest("payKey123", "사용자 요청");

        mockMvc.perform(post("/payments/cancel")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is(400));
    }

    @Test
    @DisplayName("/payments/saveAmount - 결제 금액 임시 저장 성공")
    void saveAmount_success() throws Exception {
        SaveAmountRequest request = new SaveAmountRequest("order001", 1000L);

        mockMvc.perform(post("/payments/saveAmount")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("/payments/verifyAmount - 세션에 금액 없음")
    void verifyAmount_noSession() throws Exception {
        SaveAmountRequest request = new SaveAmountRequest("order999", 1000L); // 세션에 없음

        mockMvc.perform(post("/payments/verifyAmount")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("/payments/verifyAmount - 세션 금액 타입 불일치")
    void verifyAmount_typeMismatch() throws Exception {
        session.setAttribute("order001", "잘못된타입"); // String이 들어감

        SaveAmountRequest request = new SaveAmountRequest("order001", 1000L);

        mockMvc.perform(post("/payments/verifyAmount")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("/payments/verifyAmount - 금액 불일치")
    void verifyAmount_amountMismatch() throws Exception {
        session.setAttribute("order001", 900L); // 다르게 저장됨

        SaveAmountRequest request = new SaveAmountRequest("order001", 1000L);

        mockMvc.perform(post("/payments/verifyAmount")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("/payments/plan - 사용자 플랜 조회 성공")
    void getUserPlan_success() throws Exception {
        User user = User.builder()
                .id(1L)
                .email("test@goodjob.com")
                .plan(TossPaymentPlan.베이직)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/payments/plan")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("/payments/cancelPlan - 플랜 취소 성공")
    void cancelPlan_success() throws Exception {
        User user = User.builder()
                .id(1L)
                .email("test@goodjob.com")
                .plan(TossPaymentPlan.베이직) // 기존은 베이직
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(post("/payments/cancelPlan")
                        .session(session)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
    }
}
