package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.ApplicationResponse;
import com.www.goodjob.dto.ApplicationUpdateRequest;
import com.www.goodjob.enums.ApplicationStatus;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.ApplicationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ApplicationController.class)
@Import(TestSecurityConfig.class)
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ApplicationService applicationService;

    private CustomUserDetails getMockUserDetails() {
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .build();
        return new CustomUserDetails(user);
    }

    @Test
    @WithMockUser
    @DisplayName("/applications/apply - 지원 이력 추가 성공")
    void addApplication_success() throws Exception {
        mockMvc.perform(post("/applications/apply")
                        .param("jobId", "100")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isCreated());

        verify(applicationService).addApplication(any(User.class), eq(100L));
    }

    @Test
    @WithMockUser
    @DisplayName("/applications - 지원 이력 목록 조회 성공")
    void getApplications_success() throws Exception {
        ApplicationResponse response = new ApplicationResponse(
                1L,
                100L,
                "프론트엔드 개발자",
                "토스",
                LocalDate.of(2024, 12, 31),
                ApplicationStatus.지원,  // ← 여기 수정
                "1차 면접 완료",
                LocalDateTime.now()
        );

        given(applicationService.getApplications(any(User.class))).willReturn(List.of(response));

        mockMvc.perform(get("/applications")
                        .with(user(getMockUserDetails())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].jobTitle").value("프론트엔드 개발자"))
                .andExpect(jsonPath("$[0].companyName").value("토스"));
    }

    @Test
    @WithMockUser
    @DisplayName("/applications - 지원 이력 수정 성공")
    void updateApplication_success() throws Exception {
        ApplicationUpdateRequest dto = new ApplicationUpdateRequest(ApplicationStatus.면접, "메모");
        mockMvc.perform(put("/applications")
                        .param("jobId", "100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(dto))
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(applicationService).updateApplicationByJobId(any(User.class), eq(100L), any(ApplicationUpdateRequest.class));
    }

    @Test
    @WithMockUser
    @DisplayName("/applications - 지원 이력 삭제 성공")
    void deleteApplication_success() throws Exception {
        mockMvc.perform(delete("/applications")
                        .param("jobId", "100")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(applicationService).deleteApplicationByJobId(any(User.class), eq(100L));
    }
}