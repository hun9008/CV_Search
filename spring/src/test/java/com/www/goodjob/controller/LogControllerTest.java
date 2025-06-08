package com.www.goodjob.controller;

import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.domain.User;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.JobLogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.www.goodjob.enums.EventType;

@WebMvcTest(LogController.class)
@Import(TestSecurityConfig.class)
class LogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JobLogService jobLogService;

    private CustomUserDetails getMockUserDetails() {
        var user = com.www.goodjob.domain.User.builder()
                .id(1L)
                .email("test@example.com")
                .name("홍길동")
                .build();
        return new CustomUserDetails(user);
    }

    @Test
    @DisplayName("/log/event - 공고 이벤트 로깅 성공")
    void logJobEvent_success() throws Exception {
        mockMvc.perform(post("/log/event")
                        .param("jobId", "123")
                        .param("event", "click")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk());

        verify(jobLogService).logEvent(1L, 123L, EventType.click);
    }

    @Test
    @DisplayName("/log/event - 인증되지 않은 사용자")
    void logJobEvent_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/log/event")
                        .param("jobId", "123")
                        .param("event", "CLICK")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

}