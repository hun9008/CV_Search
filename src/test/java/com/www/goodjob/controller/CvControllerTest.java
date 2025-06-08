package com.www.goodjob.controller;

import com.www.goodjob.config.SecurityConfigTest;
import com.www.goodjob.dto.CvDto;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.CvService;
import com.www.goodjob.service.S3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CvController.class)
@Import(SecurityConfigTest.class)
class CvControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CvService cvService;

    @MockitoBean
    private S3Service s3Service;

    private CustomUserDetails getMockUserDetails() {
        var user = com.www.goodjob.domain.User.builder()
                .id(1L)
                .name("홍길동")
                .email("test@example.com")
                .build();
        return new CustomUserDetails(user);
    }

    @Test
    @DisplayName("/cv/delete-cv - 인증된 사용자일 경우 CV 삭제 성공")
    void deleteCv_authenticated_returnsOk() throws Exception {
        long cvId = 1L;
        String message = "CV 삭제 완료";
        given(cvService.deleteCv(cvId)).willReturn(message);

        mockMvc.perform(delete("/cv/delete-cv")
                        .param("cvId", String.valueOf(cvId))
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(message));
    }

    @Test
    @DisplayName("/cv/delete-cv - 내부 서버 에러 발생 시 500 반환")
    void deleteCv_internalError_returns500() throws Exception {
        long cvId = 1L;
        given(cvService.deleteCv(cvId)).willThrow(new RuntimeException("삭제 실패"));

        mockMvc.perform(delete("/cv/delete-cv")
                        .param("cvId", String.valueOf(cvId))
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("삭제 실패"));
    }

//    @Test
//    @DisplayName("/cv/delete-cv - 인증되지 않은 사용자")
//    void deleteCv_unauthenticated_throwsException() throws Exception {
//        mockMvc.perform(delete("/cv/delete-cv")
//                        .param("cvId", "1")
//                        .with(csrf()))
//                .andExpect(status().isInternalServerError())
//                .andExpect(jsonPath("$.error").exists()); // or custom exception resolver if applied
//    }

    @Test
    @DisplayName("/cv/me - CV 조회 성공")
    void getMyCv_success() throws Exception {
        CvDto dto = new CvDto(1L, 1L, "cv1.pdf", LocalDateTime.now());

        given(cvService.getMyCvs(1L)).willReturn(List.of(dto));

        mockMvc.perform(get("/cv/me")
                        .with(user(getMockUserDetails())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].fileName").value("cv1.pdf"));
    }

    @Test
    @DisplayName("/cv/me - CV 존재하지 않을 때 404")
    void getMyCv_notFound() throws Exception {
        given(cvService.getMyCvs(1L)).willThrow(new NoSuchElementException("CV가 존재하지 않습니다."));

        mockMvc.perform(get("/cv/me")
                        .with(user(getMockUserDetails())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("CV가 존재하지 않습니다."));
    }

    @Test
    @DisplayName("/cv/summary-cv - 요약 성공")
    void summaryCv_success() throws Exception {
        given(cvService.summaryCv(1L)).willReturn("요약 완료");

        mockMvc.perform(post("/cv/summary-cv")
                        .param("cvId", "1")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary").value("요약 완료"));
    }

//    @Test
//    @DisplayName("/cv/summary-cv - 인증되지 않은 사용자일 경우 500 반환")
//    void summaryCv_unauthenticated_throwsException() throws Exception {
//        mockMvc.perform(post("/cv/summary-cv")
//                        .param("cvId", "1")
//                        .with(csrf()))
//                .andExpect(status().isInternalServerError())
//                .andExpect(jsonPath("$.error").value("인증되지 않은 사용자입니다. JWT를 확인하세요."));
//    }

    @Test
    @DisplayName("/cv/summary-cv - 서비스 예외 발생 시 500 반환")
    void summaryCv_serviceThrowsException_returns500() throws Exception {
        given(cvService.summaryCv(1L)).willThrow(new RuntimeException("요약 실패"));

        mockMvc.perform(post("/cv/summary-cv")
                        .param("cvId", "1")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("CV 요약 중 오류 발생: 요약 실패"));
    }

    @Test
    @DisplayName("/cv/delete-all-cvs - 사용자 CV 전체 삭제")
    void deleteAllCvs_success() throws Exception {
        given(cvService.deleteAllCvsByUserId(1L)).willReturn(List.of("cv1", "cv2"));

        mockMvc.perform(delete("/cv/delete-all-cvs")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(2))
                .andExpect(jsonPath("$.details[0]").value("cv1"))
                .andExpect(jsonPath("$.details[1]").value("cv2"));
    }

//    @Test
//    @DisplayName("/cv/delete-all-cvs - 인증되지 않은 사용자일 경우 500 반환")
//    void deleteAllCvs_unauthenticated_throwsException() throws Exception {
//        mockMvc.perform(delete("/cv/delete-all-cvs")
//                        .with(csrf()))
//                .andExpect(status().isInternalServerError())
//                .andExpect(jsonPath("$.error").value("인증되지 않은 사용자입니다. JWT를 확인하세요."));
//    }

    @Test
    @DisplayName("/cv/delete-all-cvs - 서비스 예외 발생 시 500 반환")
    void deleteAllCvs_serviceThrowsException_returns500() throws Exception {
        given(cvService.deleteAllCvsByUserId(1L)).willThrow(new RuntimeException("전체 삭제 실패"));

        mockMvc.perform(delete("/cv/delete-all-cvs")
                        .with(user(getMockUserDetails()))
                        .with(csrf()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("전체 삭제 실패"));
    }

    @Test
    @DisplayName("/cv/me - 서비스 내부 예외 발생 시 500 반환")
    void getMyCv_internalError() throws Exception {
        given(cvService.getMyCvs(1L)).willThrow(new RuntimeException("DB 연결 실패"));

        mockMvc.perform(get("/cv/me")
                        .with(user(getMockUserDetails())))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("DB 연결 실패"));
    }
//
//    @Test
//    @DisplayName("/cv/me - 인증되지 않은 사용자일 경우 500 반환")
//    void getMyCv_unauthenticated_returns500() throws Exception {
//        mockMvc.perform(get("/cv/me"))
//                .andExpect(status().isInternalServerError())
//                .andExpect(jsonPath("$.error").value("인증되지 않은 사용자입니다. JWT를 확인하세요."));
//    }
}