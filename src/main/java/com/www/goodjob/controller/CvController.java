package com.www.goodjob.controller;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.CvService;
import com.www.goodjob.service.S3Service;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/cv")
public class CvController {

    private final CvService cvService;
    private final S3Service s3Service;

    @Operation(summary = "특정 cv 하나 삭제", description = "FastAPI 서버로 특정 cv 하나 삭제 요청을 보냄." +
            "해당 cv에 대해 ES에서 vector & RDB삭제")
    @DeleteMapping("/delete-cv")
    public ResponseEntity<?> deleteJob(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String fileName
    ) {
        if (userDetails == null) {
            throw new RuntimeException("인증되지 않은 사용자입니다. JWT를 확인하세요.");
        }
        Long userId = userDetails.getId();
        try {
            String message = cvService.deleteCv(userId);
            s3Service.deleteFile(fileName);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
