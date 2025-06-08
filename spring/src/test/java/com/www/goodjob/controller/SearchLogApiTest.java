package com.www.goodjob.controller;

import com.www.goodjob.config.GlobalMockBeans;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.SearchLogDto;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.security.CustomUserDetailsService;
import com.www.goodjob.service.JobService;
import com.www.goodjob.service.SearchLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(JobController.class)
@AutoConfigureMockMvc
@Import(GlobalMockBeans.class)
class SearchLogApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SearchLogService searchLogService;

    @Autowired
    private JobService jobService;

    @BeforeEach
    void setupSecurityContext() {
        User fakeUser = new User();
        fakeUser.setId(1L);
        fakeUser.setEmail("testuser@example.com");
        fakeUser.setName("테스트유저");

        CustomUserDetails userDetails = new CustomUserDetails(fakeUser);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );
    }

    @Test
    @DisplayName("검색 기록 조회 API 테스트")
    void getSearchHistory_shouldReturnRecentSearchKeywords() throws Exception {
        List<SearchLogDto> dummy = List.of(
                new SearchLogDto("토스", LocalDateTime.now()),
                new SearchLogDto("백엔드", LocalDateTime.now().minusMinutes(10))
        );

        given(searchLogService.getSearchHistory(any(User.class))).willReturn(dummy);

        mockMvc.perform(get("/jobs/search/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].keyword").value("토스"));
    }

    @Test
    @DisplayName("검색 기록 전체 삭제 API 테스트")
    void deleteAllSearchHistory_shouldRemoveAllKeywords() throws Exception {
        mockMvc.perform(delete("/jobs/search/history/delete")
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(searchLogService).deleteAllHistory(any(User.class));
    }

    @Test
    @DisplayName("검색 기록 하나 삭제 API 테스트")
    void deleteSingleSearchKeyword_shouldRemoveSpecificKeyword() throws Exception {
        mockMvc.perform(delete("/jobs/search/history/delete-one")
                        .param("keyword", "토스")
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(searchLogService).deleteKeyword(any(User.class), eq("토스"));
    }
}