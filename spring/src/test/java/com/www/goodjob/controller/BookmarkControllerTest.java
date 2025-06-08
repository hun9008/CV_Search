package com.www.goodjob.controller;

import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.BookmarkService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@WebMvcTest(BookmarkController.class)
@Import(TestSecurityConfig.class)
class BookmarkControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private BookmarkService bookmarkService;

    private CustomUserDetails getMockUserDetails() {
        User user = User.builder()
                .id(1L)
                .name("홍길동")
                .email("test@example.com")
                .build();
        return new CustomUserDetails(user);
    }

    @Test
    @DisplayName("/bookmark/add - 북마크 추가 성공")
    void addBookmark_success() throws Exception {
        given(bookmarkService.addBookmark(1L, 100L)).willReturn(true);

        mockMvc.perform(post("/bookmark/add")
                        .param("JobId", "100")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("add new bookmark."));
    }

    @Test
    @DisplayName("/bookmark/add - 북마크 추가 실패")
    void addBookmark_fail() throws Exception {
        given(bookmarkService.addBookmark(1L, 100L)).willReturn(false);

        mockMvc.perform(post("/bookmark/add")
                        .param("JobId", "100")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("fail to add new bookmark."));
    }

    @Test
    @DisplayName("/bookmark/remove - 북마크 삭제 성공")
    void removeBookmark_success() throws Exception {
        given(bookmarkService.removeBookmark(1L, 100L)).willReturn(true);

        mockMvc.perform(delete("/bookmark/remove")
                        .param("JobId", "100")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("bookmark removed."));
    }


    @Test
    @DisplayName("/bookmark/remove - 북마크 삭제 실패")
    void removeBookmark_fail() throws Exception {
        given(bookmarkService.removeBookmark(1L, 100L)).willReturn(false);

        mockMvc.perform(delete("/bookmark/remove")
                        .param("JobId", "100")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("fail to remove bookmark."));
    }

    @Test
    @DisplayName("/bookmark/me - 내 북마크 목록 조회 성공")
    void getMyBookmarks_success() throws Exception {
        User mockUser = User.builder()
                .id(1L)
                .name("홍길동")
                .email("test@example.com")
                .build();

        List<ScoredJobDto> mockBookmarks = List.of(
                ScoredJobDto.builder()
                        .id(1L)
                        .score(0.95)
                        .build()
        );
        given(userRepository.findById(1L)).willReturn(Optional.of(mockUser));
        given(bookmarkService.getBookmarkedJobsByUser(mockUser)).willReturn(mockBookmarks);

        mockMvc.perform(get("/bookmark/me")
                        .with(user(getMockUserDetails())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].score").value(0.95));
    }
}