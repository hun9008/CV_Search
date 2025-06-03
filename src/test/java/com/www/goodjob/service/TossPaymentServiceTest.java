package com.www.goodjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.TossPayment;
import com.www.goodjob.domain.User;
import com.www.goodjob.enums.TossPaymentMethod;
import com.www.goodjob.enums.TossPaymentPlan;
import com.www.goodjob.enums.TossPaymentStatus;
import com.www.goodjob.repository.TossPaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TossPaymentServiceTest {

    private TossPaymentService tossPaymentService;
    private TossPaymentRepository tossPaymentRepository;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        tossPaymentRepository = mock(TossPaymentRepository.class);
        tossPaymentService = new TossPaymentService(tossPaymentRepository);
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("handlePaymentConfirmation - TossPayment 정상 생성")
    void handlePaymentConfirmation() {
        // given
        User user = User.builder().id(1L).email("test@goodjob.com").plan(TossPaymentPlan.스타터).build();

        JsonNode jsonNode = objectMapper.createObjectNode()
                .put("paymentKey", "pay123")
                .put("orderId", "order123")
                .put("totalAmount", 3000L)
                .put("method", "카드")
                .put("status", "DONE");

        // when
        TossPayment payment = tossPaymentService.handlePaymentConfirmation(jsonNode, user);

        // then
        assertNotNull(payment);
        assertEquals("pay123", payment.getTossPaymentKey());
        assertEquals("order123", payment.getTossOrderId());
        assertEquals(3000L, payment.getTotalAmount());
        assertEquals(TossPaymentMethod.카드, payment.getTossPaymentMethod());
        assertEquals(TossPaymentStatus.DONE, payment.getTossPaymentStatus());
        assertEquals(TossPaymentPlan.베이직, payment.getTossPaymentPlan());
        verify(tossPaymentRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("cancelStatusUpdate - 결제 상태를 CANCELED로 업데이트")
    void cancelStatusUpdate() {
        // given
        TossPayment payment = TossPayment.builder()
                .tossPaymentKey("key123")
                .tossPaymentStatus(TossPaymentStatus.DONE)
                .build();

        when(tossPaymentRepository.findByTossPaymentKey("key123"))
                .thenReturn(Optional.of(payment));

        // when
        tossPaymentService.cancelStatusUpdate("key123");

        // then
        assertEquals(TossPaymentStatus.CANCELED, payment.getTossPaymentStatus());
        verify(tossPaymentRepository, times(1)).save(payment);
    }

    @Test
    @DisplayName("updateUserPlan - 사용자 플랜 업데이트")
    void updateUserPlan() {
        // given
        User user = User.builder()
                .id(1L)
                .email("user@example.com")
                .plan(TossPaymentPlan.스타터)
                .build();

        // when
        tossPaymentService.updateUserPlan(user, TossPaymentPlan.베이직);

        // then
        assertEquals(TossPaymentPlan.베이직, user.getPlan());
    }
}
