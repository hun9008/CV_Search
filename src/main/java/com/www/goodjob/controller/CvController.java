package com.www.goodjob.controller;

import com.www.goodjob.service.CvService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @Operation(summary = "특정 cv 하나 삭제", description = "FastAPI 서버로 특정 cv 하나 삭제 요청을 보냄." +
            "해당 cv에 대해 ES에서 vector & RDB삭제")
    @DeleteMapping("/delete-cv")
    public ResponseEntity<?> deleteJob(@RequestParam("userId") Long userId) {
        try {
            String message = cvService.deleteCv(userId);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

}
