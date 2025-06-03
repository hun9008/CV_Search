//// TossPaymentControllerTest.java
//package com.www.goodjob.controller;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.www.goodjob.dto.tossdto.CancelPaymentRequest;
//import com.www.goodjob.dto.tossdto.ConfirmPaymentRequest;
//import com.www.goodjob.dto.tossdto.SaveAmountRequest;
//import com.www.goodjob.service.TossPaymentService;
//import org.junit.jupiter.api.DisplayName;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.boot.test.context.TestConfiguration;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Import;
//import org.springframework.http.MediaType;
//import org.springframework.mock.web.MockHttpSession;
//import org.springframework.security.test.context.support.WithMockUser;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.net.URI;
//import java.net.http.HttpResponse;
//import java.util.Map;
//import java.util.Optional;
//
//import javax.net.ssl.SSLSession;
//
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.Mockito.*;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//@WebMvcTest(TossPaymentController.class)
//@AutoConfigureMockMvc
//@Import(TossPaymentControllerTest.TestConfig.class)
//class TossPaymentControllerTest {
//
//    @TestConfiguration
//    static class TestConfig {
//        @Bean
//        public TossPaymentService tossPaymentService() {
//            return mock(TossPaymentService.class);
//        }
//    }
//
//    @Autowired private MockMvc mockMvc;
//    @Autowired private ObjectMapper objectMapper;
//    @Autowired private TossPaymentService tossPaymentService;
//
//    @Test
//    @WithMockUser
//    @DisplayName("/payments/saveAmount - 금액 임시 저장")
//    void saveAmount() throws Exception {
//        SaveAmountRequest req = new SaveAmountRequest("order001", "1000");
//        mockMvc.perform(post("/payments/saveAmount")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req))
//                        .session(new MockHttpSession()))
//                .andExpect(status().isOk())
//                .andExpect(content().string("Payment temp save successful"));
//    }
//
//    @Test
//    @WithMockUser
//    @DisplayName("/payments/verifyAmount - 금액 검증 성공")
//    void verifyAmountSuccess() throws Exception {
//        MockHttpSession session = new MockHttpSession();
//        session.setAttribute("order001", "1000");
//        SaveAmountRequest req = new SaveAmountRequest("order001", "1000");
//
//        mockMvc.perform(post("/payments/verifyAmount")
//                        .session(session)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isOk())
//                .andExpect(content().string("Payment is valid"));
//    }
//
//    @Test
//    @WithMockUser
//    @DisplayName("/payments/verifyAmount - 금액 검증 실패")
//    void verifyAmountFail() throws Exception {
//        MockHttpSession session = new MockHttpSession();
//        session.setAttribute("order001", "9999");
//        SaveAmountRequest req = new SaveAmountRequest("order001", "1000");
//
//        mockMvc.perform(post("/payments/verifyAmount")
//                        .session(session)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isBadRequest());
//    }
//
//    @Test
//    @WithMockUser
//    @DisplayName("/payments/cancel - 결제 취소")
//    void cancelPayment() throws Exception {
//        CancelPaymentRequest req = new CancelPaymentRequest("payKey123", "사용자 요청");
//        when(tossPaymentService.requestCancel(req)).thenReturn((HttpResponse) new FakeHttpResponse(200, "CANCELED"));
//        doNothing().when(tossPaymentService).cancelStatusUpdate("payKey123");
//
//        mockMvc.perform(post("/payments/cancel")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isOk());
//    }
//
//    @Test
//    @WithMockUser
//    @DisplayName("/payments/plan - 유저 플랜 조회")
//    void getUserPlan() throws Exception {
//        mockMvc.perform(get("/payments/plan"))
//                .andExpect(status().isOk());
//    }
//
//    @Test
//    @WithMockUser
//    @DisplayName("/payments/confirm - 결제 승인 전체 흐름")
//    void confirmPayment() throws Exception {
//        ConfirmPaymentRequest req = new ConfirmPaymentRequest();
//        java.lang.reflect.Field f1 = ConfirmPaymentRequest.class.getDeclaredField("paymentKey");
//        java.lang.reflect.Field f2 = ConfirmPaymentRequest.class.getDeclaredField("orderId");
//        java.lang.reflect.Field f3 = ConfirmPaymentRequest.class.getDeclaredField("amount");
//        f1.setAccessible(true); f2.setAccessible(true); f3.setAccessible(true);
//        f1.set(req, "payKey123");
//        f2.set(req, "order001");
//        f3.set(req, 1000L);
//
//        when(tossPaymentService.requestConfirm(any())).thenReturn(
//                new FakeHttpResponse(200, "{\"paymentKey\":\"payKey123\",\"orderId\":\"order001\",\"totalAmount\":1000,\"method\":\"카드\",\"status\":\"DONE\"}"));
//        when(tossPaymentService.handlePaymentConfirmation(any(), any())).thenReturn(null);
//
//        mockMvc.perform(post("/payments/confirm")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(req)))
//                .andExpect(status().isOk());
//    }
//
//    static class FakeHttpResponse implements HttpResponse<String> {
//        private final int status;
//        private final String body;
//        FakeHttpResponse(int status, String body) {
//            this.status = status;
//            this.body = body;
//        }
//        @Override public int statusCode() { return status; }
//        @Override public String body() { return body; }
//        @Override public java.net.http.HttpRequest request() { return null; }
//        @Override public Optional<java.net.http.HttpResponse<String>> previousResponse() { return Optional.empty(); }
//        @Override public java.net.http.HttpHeaders headers() { return null; }
//        @Override public URI uri() { return null; }
//        @Override public java.net.http.HttpClient.Version version() { return null; }
//        @Override public Optional<SSLSession> sslSession() { return Optional.empty(); }
//    }
//}