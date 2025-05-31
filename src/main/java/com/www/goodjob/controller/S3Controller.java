package com.www.goodjob.controller;

import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.CvService;
import com.www.goodjob.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/s3")
public class S3Controller {

    private final S3Service s3Service;
    private final CvService cvService;

    @GetMapping("/presigned-url/upload")
    public ResponseEntity<String> getPresignedPutUrl(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String fileName) {

        if (userDetails == null) {
            throw new RuntimeException("인증되지 않은 사용자입니다. JWT를 확인하세요.");
        }
        Long userId = userDetails.getId();

        if (!s3Service.isFileNameAvailable(userId, fileName)) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("File name already exists for this user.");
        }

        String url = s3Service.generatePresignedPutUrl(fileName);
        return ResponseEntity.ok(url);
    }

    @GetMapping("/presigned-url/download")
    public ResponseEntity<String> getPresignedGetUrl(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String fileName) {

        Long userId = userDetails.getId();

        if (!s3Service.isOwnedFile(userId, fileName)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("지정된 사용자에게 해당 파일 권한이 없습니다.");
        }

        String url = s3Service.generatePresignedGetUrl(fileName);
        return ResponseEntity.ok(url);
    }

    @PostMapping("/confirm-upload")
    public ResponseEntity<String> confirmUpload(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String fileName
    ) {
        Long userId = userDetails.getId();

        boolean available = s3Service.isFileNameAvailable(userId, fileName);
        if (!available) {
            return ResponseEntity.badRequest().body("이미 동일한 파일명이 존재합니다.");
        }

        boolean saved = s3Service.saveCvIfUploaded(userId, fileName);
        if (saved) {
            return ResponseEntity.ok("CV 정보가 저장되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("S3에 해당 파일이 존재하지 않습니다.");
        }
    }

    @PostMapping("/confirm-re-upload")
    public ResponseEntity<String> confirmReUpload(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String oldFileName,
            @RequestParam String newFileName
    ) {
        Long userId = userDetails.getId();

        try {
            String message = cvService.deleteCv(userId, oldFileName);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("기존 이력서 삭제 중 오류가 발생했습니다.");
        }

        boolean saved = s3Service.saveCvIfUploaded(userId, newFileName);
        if (saved) {
            return ResponseEntity.ok("CV 정보가 저장되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("S3에 해당 파일이 존재하지 않습니다.");
        }
    }

    @PostMapping("/rename-cv")
    public ResponseEntity<String> renameCvFile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String oldFileName,
            @RequestParam String newFileName) {

        Long userId = userDetails.getId();

        boolean renamed = s3Service.renameS3FileAndUpdateDB(userId, oldFileName, newFileName);

        if (renamed) {
            return ResponseEntity.ok("CV 파일명이 성공적으로 변경되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("파일명 변경에 실패했습니다. 파일이 존재하지 않거나 접근 권한이 없습니다.");
        }
    }
}
