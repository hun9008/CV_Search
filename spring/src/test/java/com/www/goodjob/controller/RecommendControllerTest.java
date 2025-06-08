package com.www.goodjob.controller;

import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.AsyncService;
import com.www.goodjob.service.RecommendService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RecommendController.class)
@Import(TestSecurityConfig.class)
class RecommendControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecommendService recommendService;

    @MockitoBean
    private AsyncService asyncService;

    private CustomUserDetails getMockUserDetails() {
        var user = com.www.goodjob.domain.User.builder()
                .id(1L)
                .name("홍길동")
                .email("test@example.com")
                .build();
        return new CustomUserDetails(user);
    }

    @Test
    @DisplayName("/rec/topk-list - 추천 리스트 조회 성공")
    void recommendTopK_success() throws Exception {
        List<ScoredJobDto> mockList = List.of(
                ScoredJobDto.builder()
                        .id(1L)
                        .score(0.95)
                        .build()
        );
        given(recommendService.requestRecommendation(1L, 3)).willReturn(mockList);

        mockMvc.perform(post("/rec/topk-list")
                        .param("topk", "3")
                        .param("cvId", "1")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].score").value(0.95));
    }

    @Test
    @DisplayName("/rec/cache - 추천 캐시 생성 성공")
    void cacheRecommendation_success() throws Exception {
        mockMvc.perform(post("/rec/cache")
                        .param("cvId", "1")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("추천 캐시 생성 시작. log 확인 필요."));

        verify(asyncService).cacheRecommendForUser(1L);
    }

    @Test
    @DisplayName("/rec/feedback - 피드백 생성 또는 조회 성공")
    void feedback_success() throws Exception {
        given(recommendService.getOrGenerateFeedback(1L, 2L)).willReturn("이력서가 해당 직무와 잘 맞습니다.");

        mockMvc.perform(post("/rec/feedback")
                        .param("cvId", "1")
                        .param("jobId", "2")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("이력서가 해당 직무와 잘 맞습니다."));
    }
}