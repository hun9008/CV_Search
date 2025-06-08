package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.config.GlobalMockBeans;
import com.www.goodjob.dto.UserFeedbackDto;
import com.www.goodjob.security.CustomUserDetailsService;
import com.www.goodjob.service.UserFeedbackService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.Collections;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserFeedbackAdminController.class)
@AutoConfigureMockMvc
@Import(GlobalMockBeans.class)
class UserFeedbackAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserFeedbackService feedbackService;

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("전체 피드백 목록 조회시 200 응답")
    void getAllFeedback_200() throws Exception {
        Mockito.when(feedbackService.getAllFeedback()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/admin/feedback"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("키워드 검색시 200 응답")
    void searchFeedback_200() throws Exception {
        Mockito.when(feedbackService.searchFeedback("test")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/admin/feedback/search?keyword=test"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("기간별 피드백 조회시 200 응답")
    void getFeedbackByPeriod_200() throws Exception {
        Mockito.when(feedbackService.getFeedbackByPeriod("month")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/admin/feedback/period?period=month"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("평균 만족도 조회시 200 응답")
    void getAverageScore_200() throws Exception {
        Mockito.when(feedbackService.getAverageSatisfaction()).thenReturn(4.3);

        mockMvc.perform(get("/admin/feedback/average"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("피드백 총 개수 조회시 200 응답")
    void getTotalFeedbackCount_200() throws Exception {
        Mockito.when(feedbackService.getTotalFeedbackCount()).thenReturn(100L);

        mockMvc.perform(get("/admin/feedback/count"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DisplayName("피드백 수정 성공시 204 응답")
    void updateFeedback_204() throws Exception {
        UserFeedbackDto.Update dto = new UserFeedbackDto.Update();
        dto.setContent("수정된 내용");
        dto.setSatisfactionScore(4);

        mockMvc.perform(put("/admin/feedback/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DisplayName("피드백 삭제 성공시 204 응답")
    void deleteFeedback_204() throws Exception {
        mockMvc.perform(delete("/admin/feedback/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
