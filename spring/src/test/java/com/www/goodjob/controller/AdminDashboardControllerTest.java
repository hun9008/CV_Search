package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.domain.Job;
import com.www.goodjob.dto.*;
import com.www.goodjob.service.DashboardService;
import com.www.goodjob.service.JobService;
import com.www.goodjob.service.MonitoringService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminDashboardController.class)
@Import(TestSecurityConfig.class)
class AdminDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardService dashboardService;

    @MockitoBean
    private JobService jobService;

    @MockitoBean
    private MonitoringService monitoringService;

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("/admin/dashboard - 대시보드 통계 조회 성공")
    void getDashboardStats_success() throws Exception {
        DashboardDto dto = DashboardDto.builder()
                .totalUserCount(100)
                .weeklyUserChange(5)
                .totalJobCount(500)
                .weeklyJobChange(12)
                .averageSatisfaction(4.3f)
                .weeklySatisfactionChange(0.1f)
                .activeUserCount(60)
                .weeklyActiveUserChange(3)
                .ctr(25.4f)
                .dailyCtrList(List.of(22.1f, 23.5f, 24.0f, 25.1f, 25.2f, 25.3f, 25.4f))
                .topKeywords(List.of(
                        new KeywordCount("백엔드", 20),
                        new KeywordCount("프론트", 15),
                        new KeywordCount("AI", 10)
                ))
                .build();

        given(dashboardService.getDashboardStats()).willReturn(dto);

        mockMvc.perform(get("/admin/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUserCount").value(100))
                .andExpect(jsonPath("$.weeklyUserChange").value(5))
                .andExpect(jsonPath("$.totalJobCount").value(500))
                .andExpect(jsonPath("$.ctr").value(25.4));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("/admin/dashboard/server-status - 서버 상태 조회 성공")
    void getServerStatus_success() throws Exception {
        ServerStatus redis = new ServerStatus("Redis", true, 50.0, 30.0);
        ServerStatus spring = new ServerStatus("Spring", true, 35.5, 20.0);
        ServerStatus fastapi = new ServerStatus("FastAPI", false, 0.0, 0.0);

        given(monitoringService.getRedisStatus()).willReturn(redis);
        given(monitoringService.getSpringStatus()).willReturn(spring);
        given(monitoringService.getFastapiStatus()).willReturn(fastapi);

        mockMvc.perform(get("/admin/dashboard/server-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Redis"))
                .andExpect(jsonPath("$[0].up").value(true)) // 수정된 부분
                .andExpect(jsonPath("$[0].responseTime").value(30.0))
                .andExpect(jsonPath("$[1].name").value("Spring"))
                .andExpect(jsonPath("$[2].name").value("FastAPI"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("/admin/dashboard/delete-one-job-valid-type - 정상 삭제")
    void deleteJobWithValidType_success() throws Exception {
        given(jobService.deleteJobWithValidType(1L, 3)).willReturn("삭제 완료");

        mockMvc.perform(delete("/admin/dashboard/delete-one-job-valid-type")
                        .param("jobId", "1")
                        .param("validType", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("삭제 완료"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("/admin/dashboard/delete-one-job-valid-type - 실패 시 500 반환")
    void deleteJobWithValidType_failure() throws Exception {
        given(jobService.deleteJobWithValidType(1L, 2)).willThrow(new RuntimeException("삭제 실패"));

        mockMvc.perform(delete("/admin/dashboard/delete-one-job-valid-type")
                        .param("jobId", "1")
                        .param("validType", "2"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("삭제 실패"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("/admin/dashboard/job-valid-type - 유효 공고 목록 조회 성공")
    void getJobWithValidType_success() throws Exception {
        ValidJobDto dto = ValidJobDto.builder()
                .id(1L)
                .companyName("테스트")
                .title("채용공고")
                .jobValidType(1)
                .isPublic(false)
                .createdAt(LocalDateTime.now())
                .applyEndDate(LocalDate.of(2025, 6, 10))
                .url("https://job.com")
                .build();

        given(jobService.findAllJobWithValidType(any())).willReturn(List.of(dto));

        mockMvc.perform(get("/admin/dashboard/job-valid-type"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].companyName").value("테스트"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("/admin/dashboard/job-valid-type - 예외 발생 시 500 반환")
    void getJobWithValidType_exception_returns500() throws Exception {
        given(jobService.findAllJobWithValidType(any(Pageable.class)))
                .willThrow(new RuntimeException("조회 실패"));

        mockMvc.perform(get("/admin/dashboard/job-valid-type"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("조회 실패"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("/admin/dashboard/job - 채용 공고 생성/수정 성공")
    void createOrUpdateJob_success() throws Exception {
        CreateJobDto request = CreateJobDto.builder()
                .title("백엔드 개발자")
                .companyName("GoodJob Inc.")
                .url("https://goodjob.com")
                .jobRegions(new ArrayList<>(List.of(1L)))  // 여기 수정됨
                .build();

        Job mockJob = new Job();
        mockJob.setId(1L);
        mockJob.setTitle("백엔드 개발자");
        mockJob.setCompanyName("GoodJob Inc.");
        mockJob.setUrl("https://goodjob.com");

        given(jobService.createOrUpdateJob(any())).willReturn(mockJob);

        mockMvc.perform(post("/admin/dashboard/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.title").value("백엔드 개발자"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("/admin/dashboard/job - 생성 중 예외 발생 시 500 반환")
    void createOrUpdateJob_failure() throws Exception {
        CreateJobDto request = new CreateJobDto(
                "title", "company", "url", "desc", "requirement",
                "benefit", "jobType", "salary", "experience",
                new ArrayList<>(List.of(1L)),
                LocalDate.now(), LocalDate.now().plusDays(30),
                true,
                "department", "position", "workType", "keyword",
                1
        );

        given(jobService.createOrUpdateJob(any())).willThrow(new RuntimeException("생성 실패"));

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());  // LocalDate 지원

        mockMvc.perform(post("/admin/dashboard/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("생성 실패"));
    }
}