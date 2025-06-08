package com.www.goodjob.controller;

import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.domain.JobUpdateStatus;
import com.www.goodjob.service.JobUpdateService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.www.goodjob.enums.JobTypeCategory;

import java.time.LocalDateTime;

@WebMvcTest(JobUpdateController.class)
@Import(TestSecurityConfig.class)
class JobUpdateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JobUpdateService jobUpdateService;

    @WithMockUser(username = "testUser", roles = {"USER"})
    @Test
    @DisplayName("/job-update/start - 백그라운드 업데이트 요청 성공")
    void startJobUpdate_success() throws Exception {
        mockMvc.perform(get("/job-update/start"))
                .andExpect(status().isOk())
                .andExpect(content().string("Job update started."));

        verify(jobUpdateService).requestJobUpdate();
    }

    @WithMockUser(username = "testUser", roles = {"USER"})
    @Test
    @DisplayName("/job-update/status - 현재 작업 상태 조회 성공")
    void getJobUpdateStatus_success() throws Exception {
        JobUpdateStatus mockStatus = new JobUpdateStatus();
        mockStatus.setId(1L);
        mockStatus.setRequestedAt(LocalDateTime.now());
        mockStatus.setStatus("IN_PROGRESS");
        mockStatus.setErrorMessage(null);

        given(jobUpdateService.getLatestStatus()).willReturn(mockStatus);

        mockMvc.perform(get("/job-update/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.errorMessage").doesNotExist());
    }
}