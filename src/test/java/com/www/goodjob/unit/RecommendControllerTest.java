package com.www.goodjob.unit;

import com.www.goodjob.controller.RecommendController;
import com.www.goodjob.domain.User;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.service.JwtTokenProvider;
import com.www.goodjob.service.RecommendService;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RecommendController.class)
class RecommendControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private RecommendService recommendService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void recommend_shouldReturnRecommendedList() throws Exception {
        // mock token, email, user
        String fakeToken = "mocked.jwt.token";
        String email = "test@example.com";
        Long mockUserId = 4L;
        int topk = 5;

        User mockUser = new User();
        mockUser.setId(mockUserId);
        mockUser.setEmail(email);

        // mocking
        given(jwtTokenProvider.getEmail(fakeToken)).willReturn(email);
        given(userRepository.findByEmail(email)).willReturn(Optional.of(mockUser));
        given(recommendService.requestRecommendation(mockUserId, topk)).willReturn("추천 결과!");

        mockMvc.perform(post("/recommend/topk_list")
                        .with(csrf())
                        .header("Authorization", "Bearer " + fakeToken)
                        .param("topk", String.valueOf(topk))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("추천 결과!"));
    }
}