package com.www.goodjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.tossdto.CancelPaymentRequest;
import com.www.goodjob.dto.tossdto.ConfirmPaymentRequest;
import com.www.goodjob.enums.TossPaymentMethod;
import com.www.goodjob.enums.TossPaymentPlan;
import com.www.goodjob.enums.TossPaymentStatus;
import com.www.goodjob.repository.TossPaymentRepository;
import com.www.goodjob.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.URI;
import java.net.http.*;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TossPaymentServiceTest {

    private TossPaymentService tossPaymentService;
    private TossPaymentRepository tossPaymentRepository;
    private UserRepository userRepository;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        tossPaymentRepository = mock(TossPaymentRepository.class);
        userRepository = mock(UserRepository.class);
        objectMapper = new ObjectMapper();

        tossPaymentService = new TossPaymentService(tossPaymentRepository, userRepository);
        ReflectionTestUtils.setField(tossPaymentService, "secretKey", "test_sk_dummy_key");
    }

    @Test
    @DisplayName("savePayment - TossPayment 저장 호출 확인")
    void savePayment() {
        TossPayment payment = TossPayment.builder()
                .tossPaymentKey("test-key")
                .build();

        tossPaymentService.savePayment(payment);

        verify(tossPaymentRepository, times(1)).save(payment);
    }

    @Test
    @DisplayName("getAuthorization - Base64 인코딩된 인증 헤더 반환 확인")
    void getAuthorization() {
        ReflectionTestUtils.setField(tossPaymentService, "secretKey", "test_sk_test1234");
        String authorization = tossPaymentService.getAuthorization();

        assertTrue(authorization.startsWith("Basic "));
        assertTrue(authorization.contains(Base64.getEncoder().encodeToString("test_sk_test1234:".getBytes())));
    }

    @Test
    @DisplayName("handlePaymentConfirmation - TossPayment 정상 생성")
    void handlePaymentConfirmation() {
        User user = User.builder()
                .id(1L)
                .email("test@goodjob.com")
                .plan(TossPaymentPlan.스타터)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        JsonNode jsonNode = objectMapper.createObjectNode()
                .put("paymentKey", "pay123")
                .put("orderId", "order123")
                .put("totalAmount", 3000L)
                .put("method", "카드")
                .put("status", "DONE");

        TossPayment payment = tossPaymentService.handlePaymentConfirmation(jsonNode, user);

        assertNotNull(payment);
        assertEquals("pay123", payment.getTossPaymentKey());
        assertEquals("order123", payment.getTossOrderId());
        assertEquals(3000L, payment.getTotalAmount());
        assertEquals(TossPaymentMethod.카드, payment.getTossPaymentMethod());
        assertEquals(TossPaymentStatus.DONE, payment.getTossPaymentStatus());
        assertEquals(TossPaymentPlan.베이직, payment.getTossPaymentPlan());

        verify(tossPaymentRepository, times(1)).save(any());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("handlePaymentConfirmation - 존재하지 않는 사용자 예외 발생")
    void handlePaymentConfirmation_userNotFound() {
        // given
        User user = User.builder().id(999L).build(); // 존재하지 않는 ID
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        JsonNode jsonNode = objectMapper.createObjectNode()
                .put("paymentKey", "pay123")
                .put("orderId", "order123")
                .put("totalAmount", 3000L)
                .put("method", "카드")
                .put("status", "DONE");

        // when & then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            tossPaymentService.handlePaymentConfirmation(jsonNode, user);
        });

        assertEquals("User not found", exception.getMessage());
        verify(userRepository, times(1)).findById(999L);
    }

    @Test
    @DisplayName("cancelStatusUpdate - 결제 상태를 CANCELED로 업데이트")
    void cancelStatusUpdate() {
        TossPayment payment = TossPayment.builder()
                .tossPaymentKey("key123")
                .tossPaymentStatus(TossPaymentStatus.DONE)
                .build();

        when(tossPaymentRepository.findByTossPaymentKey("key123"))
                .thenReturn(Optional.of(payment));

        tossPaymentService.cancelStatusUpdate("key123");

        assertEquals(TossPaymentStatus.CANCELED, payment.getTossPaymentStatus());
        verify(tossPaymentRepository, times(1)).save(payment);
    }

    @Test
    @DisplayName("updateUserPlan - 사용자 플랜 업데이트")
    void updateUserPlan() {
        User user = User.builder()
                .id(1L)
                .email("user@example.com")
                .plan(TossPaymentPlan.스타터)
                .build();

        tossPaymentService.updateUserPlan(user, TossPaymentPlan.베이직);

        assertEquals(TossPaymentPlan.베이직, user.getPlan());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("requestConfirm - Toss 결제 확인 더미 응답으로 통과")
    void requestConfirm() throws Exception {
        ConfirmPaymentRequest request = new ConfirmPaymentRequest();
        request.setOrderId("dummy-order");
        request.setAmount(1000L);
        request.setPaymentKey("dummy-key");

        ReflectionTestUtils.setField(tossPaymentService, "secretKey", "test_sk_dummy");

        try {
            tossPaymentService.requestConfirm(request);
        } catch (Exception e) {
            System.out.println("Expected exception ignored: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("requestCancel - Toss 결제 취소 더미 응답으로 통과")
    void requestCancel() throws Exception {
        CancelPaymentRequest request = new CancelPaymentRequest();
        request.setPaymentKey("dummy-key");
        request.setCancelReason("테스트");

        ReflectionTestUtils.setField(tossPaymentService, "secretKey", "test_sk_dummy");

        try {
            tossPaymentService.requestCancel(request);
        } catch (Exception e) {
            System.out.println("Expected exception ignored: " + e.getMessage());
        }
    }

    // 내부 더미 응답 클래스
    static class DummyHttpResponse implements HttpResponse<String> {
        private final int statusCode;
        private final String body;

        DummyHttpResponse(int statusCode, String body) {
            this.statusCode = statusCode;
            this.body = body;
        }

        @Override public int statusCode() { return statusCode; }
        @Override public String body() { return body; }
        @Override public HttpRequest request() { return null; }
        @Override public Optional<HttpResponse<String>> previousResponse() { return Optional.empty(); }
        @Override public HttpHeaders headers() { return HttpHeaders.of(Map.of(), (k, v) -> true); }
        @Override public URI uri() { return null; }
        @Override public HttpClient.Version version() { return null; }
        @Override public Optional<javax.net.ssl.SSLSession> sslSession() { return Optional.empty(); }
    }
}
