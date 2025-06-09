package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.config.GlobalMockBeans;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.UserFeedbackDto;
import com.www.goodjob.enums.UserRole;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.UserFeedbackService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserFeedbackUserController.class)
@Import(GlobalMockBeans.class)
class UserFeedbackUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserFeedbackService feedbackService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private CustomUserDetails getMockUserDetails() {
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .name("홍길동")
                .role(UserRole.USER)
                .build();
        return new CustomUserDetails(user);
    }

    @Test
    @DisplayName("POST /user/feedback - 피드백 생성")
    void createFeedbackTest() throws Exception {
        var dto = new UserFeedbackDto.Create("너무 좋아요!", 5);
        doNothing().when(feedbackService).createFeedback(any(), any());

        mockMvc.perform(post("/user/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf())
                        .with(SecurityMockMvcRequestPostProcessors.user(getMockUserDetails())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /user/feedback/me - 내 피드백 조회")
    void getMyFeedbackTest() throws Exception {
        var list = List.of(
                new UserFeedbackDto.Response(1L, 1L, "홍길동", "좋아요", 5, LocalDateTime.now()),
                new UserFeedbackDto.Response(2L, 1L, "홍길동", "개선해주세요", 3, LocalDateTime.now())
        );

        Mockito.when(feedbackService.getFeedbackByUser(any())).thenReturn(list);

        mockMvc.perform(get("/user/feedback/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(getMockUserDetails())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[1].id").value(2L));
    }

    @Test
    @DisplayName("DELETE /user/feedback/{id} - 피드백 삭제")
    void deleteMyFeedbackTest() throws Exception {
        var mockUser = getMockUserDetails();
        doNothing().when(feedbackService).deleteMyFeedback(1L, mockUser.getUser());

        mockMvc.perform(delete("/user/feedback/1")
                        .with(csrf())
                        .with(SecurityMockMvcRequestPostProcessors.user(mockUser)))
                .andExpect(status().isOk());
    }
}
