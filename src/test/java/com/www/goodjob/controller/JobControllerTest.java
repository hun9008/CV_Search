package com.www.goodjob.controller;

import com.www.goodjob.config.GlobalMockBeans;
import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.RegionGroupDto;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.JobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.BDDMockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(JobController.class)
@AutoConfigureMockMvc
@Import({TestSecurityConfig.class, GlobalMockBeans.class})
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JobService jobService;

    @BeforeEach
    void setUpSecurityContext() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setName("Test User");

        CustomUserDetails userDetails = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );
    }

    @Test
    @DisplayName("채용 공고 검색 API - 200 OK")
    void searchJobs_shouldReturnPageOfJobs() throws Exception {
        Page<JobDto> page = new PageImpl<>(List.of());
        BDDMockito.given(jobService.searchJobs(any(), any(), any(), any(), any(), any(), any())).willReturn(page);

        mockMvc.perform(get("/jobs/search")
                        .param("keyword", "백엔드")
                        .param("jobType", "정규직")
                        .param("experience", "신입")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("근무 유형 목록 조회 API - 200 OK")
    void getJobTypes_shouldReturnList() throws Exception {
        BDDMockito.given(jobService.getAvailableJobTypes()).willReturn(List.of("정규직", "계약직"));

        mockMvc.perform(get("/jobs/job-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("정규직"));
    }

    @Test
    @DisplayName("요구 경력 목록 조회 API - 200 OK")
    void getExperienceTypes_shouldReturnList() throws Exception {
        BDDMockito.given(jobService.getAvailableExperienceTypes()).willReturn(List.of("신입", "경력"));

        mockMvc.perform(get("/jobs/experience-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[1]").value("경력"));
    }

    @Test
    @DisplayName("지역 목록 조회 API - 200 OK")
    void getRegionTypes_shouldReturnGroupedRegionList() throws Exception {
        RegionGroupDto region = new RegionGroupDto("서울", List.of("강남구", "서초구"));
        BDDMockito.given(jobService.getGroupedRegions()).willReturn(List.of(region));

        mockMvc.perform(get("/jobs/region-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sido").value("서울"))
                .andExpect(jsonPath("$[0].sigunguList[0]").value("강남구"));
    }
}
