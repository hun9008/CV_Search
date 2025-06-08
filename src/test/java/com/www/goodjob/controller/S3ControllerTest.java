package com.www.goodjob.controller;

import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.domain.User;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.S3Service;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;


@WebMvcTest(S3Controller.class)
@Import(TestSecurityConfig.class)
class S3ControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private S3Service s3Service;


    private CustomUserDetails getMockUserDetails() {
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .build();
        return new CustomUserDetails(user);
    }

    @Test
    @DisplayName("/s3/presigned-url/upload - 파일명 사용 가능 시 Presigned URL 반환")
    void getPresignedPutUrl_success() throws Exception {
        given(s3Service.isFileNameAvailable(1L, "cv1.pdf")).willReturn(true);
        given(s3Service.generatePresignedPutUrl("cv1.pdf")).willReturn("https://s3.presigned.put.url");

        mockMvc.perform(get("/s3/presigned-url/upload")
                        .param("fileName", "cv1.pdf")
                        .with(user(getMockUserDetails())))
                .andExpect(status().isOk())
                .andExpect(content().string("https://s3.presigned.put.url"));
    }

    @Test
    @DisplayName("/s3/presigned-url/upload - 파일명이 중복될 경우 409 반환")
    void getPresignedPutUrl_conflict() throws Exception {
        given(s3Service.isFileNameAvailable(1L, "cv1.pdf")).willReturn(false);

        mockMvc.perform(get("/s3/presigned-url/upload")
                        .param("fileName", "cv1.pdf")
                        .with(user(getMockUserDetails())))
                .andExpect(status().isConflict())
                .andExpect(content().string("File name already exists for this user."));
    }

    @Test
    @DisplayName("/s3/presigned-url/download - 권한 있는 파일 다운로드 Presigned URL 반환")
    void getPresignedGetUrl_success() throws Exception {
        given(s3Service.isOwnedFile(1L, "cv1.pdf")).willReturn(true);
        given(s3Service.generatePresignedGetUrl("cv1.pdf")).willReturn("https://s3.presigned.get.url");

        mockMvc.perform(get("/s3/presigned-url/download")
                        .param("fileName", "cv1.pdf")
                        .with(user(getMockUserDetails())))
                .andExpect(status().isOk())
                .andExpect(content().string("https://s3.presigned.get.url"));
    }

    @Test
    @DisplayName("/s3/presigned-url/download - 권한 없는 경우 403 반환")
    void getPresignedGetUrl_forbidden() throws Exception {
        given(s3Service.isOwnedFile(1L, "cv1.pdf")).willReturn(false);

        mockMvc.perform(get("/s3/presigned-url/download")
                        .param("fileName", "cv1.pdf")
                        .with(user(getMockUserDetails())))
                .andExpect(status().isForbidden())
                .andExpect(content().string("지정된 사용자에게 해당 파일 권한이 없습니다."));
    }

    @Test
    @DisplayName("/s3/confirm-upload - 이력서 저장 성공")
    void confirmUpload_success() throws Exception {
        given(s3Service.isFileNameAvailable(1L, "cv1.pdf")).willReturn(true);
        given(s3Service.saveCvIfUploaded(1L, "cv1.pdf")).willReturn(null);

        mockMvc.perform(post("/s3/confirm-upload")
                        .param("fileName", "cv1.pdf")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("CV 정보가 저장되었습니다."));
    }

    @Test
    @DisplayName("/s3/confirm-upload - 파일명 중복으로 실패")
    void confirmUpload_fileNameExists() throws Exception {
        given(s3Service.isFileNameAvailable(1L, "cv1.pdf")).willReturn(false);

        mockMvc.perform(post("/s3/confirm-upload")
                        .param("fileName", "cv1.pdf")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("이미 동일한 파일명이 존재합니다."));
    }

    @Test
    @DisplayName("/s3/confirm-upload - REJECT 포함 에러 메시지로 403 반환")
    void confirmUpload_rejectError() throws Exception {
        given(s3Service.isFileNameAvailable(1L, "cv1.pdf")).willReturn(true);
        given(s3Service.saveCvIfUploaded(1L, "cv1.pdf")).willReturn("[REJECT] inappropriate content");

        mockMvc.perform(post("/s3/confirm-upload")
                        .param("fileName", "cv1.pdf")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isForbidden())
                .andExpect(content().string("[REJECT] inappropriate content"));
    }

    @Test
    @DisplayName("/s3/confirm-upload - 일반 에러 메시지로 400 반환")
    void confirmUpload_generalError() throws Exception {
        given(s3Service.isFileNameAvailable(1L, "cv1.pdf")).willReturn(true);
        given(s3Service.saveCvIfUploaded(1L, "cv1.pdf")).willReturn("파일 저장 중 오류 발생");

        mockMvc.perform(post("/s3/confirm-upload")
                        .param("fileName", "cv1.pdf")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("파일 저장 중 오류 발생"));
    }

    @Test
    @DisplayName("/s3/rename-cv - 이름 변경 성공")
    void renameCv_success() throws Exception {
        given(s3Service.renameS3FileAndUpdateDB(1L, "old.pdf", "new.pdf")).willReturn(true);

        mockMvc.perform(post("/s3/rename-cv")
                        .param("oldFileName", "old.pdf")
                        .param("newFileName", "new.pdf")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("CV 파일명이 성공적으로 변경되었습니다."));
    }

    @Test
    @DisplayName("/s3/rename-cv - 이름 변경 실패 시 400 반환")
    void renameCv_fail() throws Exception {
        given(s3Service.renameS3FileAndUpdateDB(1L, "old.pdf", "new.pdf")).willReturn(false);

        mockMvc.perform(post("/s3/rename-cv")
                        .param("oldFileName", "old.pdf")
                        .param("newFileName", "new.pdf")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("파일명 변경에 실패했습니다. 파일이 존재하지 않거나 접근 권한이 없습니다."));
    }
}