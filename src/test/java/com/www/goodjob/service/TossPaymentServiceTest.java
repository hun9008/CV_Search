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

import java.net.http.HttpResponse;
import java.util.Optional;

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
        ReflectionTestUtils.setField(tossPaymentService, "secretKey", "testSecret");
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
        String authorization = tossPaymentService.getAuthorization();

        assertTrue(authorization.startsWith("Basic "));
        assertTrue(authorization.contains("dGVzdFNlY3JldDo=")); // "testSecret:" Base64
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

    @Disabled("실제 외부 호출이므로 통합 테스트 환경에서 실행 필요")
    @Test
    void requestConfirm() throws Exception {
        ConfirmPaymentRequest request = new ConfirmPaymentRequest();
        request.setOrderId("ORDER123");
        request.setAmount(5000L);
        request.setPaymentKey("PAYKEY123");

        HttpResponse<String> response = tossPaymentService.requestConfirm(request);

        assertEquals(200, response.statusCode());
    }

    @Disabled("실제 외부 호출이므로 통합 테스트 환경에서 실행 필요")
    @Test
    void requestCancel() throws Exception {
        CancelPaymentRequest request = new CancelPaymentRequest();
        request.setPaymentKey("PAYKEY123");
        request.setCancelReason("테스트");

        HttpResponse<String> response = tossPaymentService.requestCancel(request);

        assertEquals(200, response.statusCode());
    }
}
