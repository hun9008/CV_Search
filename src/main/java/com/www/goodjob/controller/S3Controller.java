package com.www.goodjob.controller;

import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.AsyncService;
import com.www.goodjob.service.CvService;
import com.www.goodjob.service.S3Service;
import io.swagger.v3.oas.annotations.Operation;
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

    @Operation(summary = "S3 업로드용 Presigned URL 발급", description = "로그인한 사용자가 지정한 파일명을 기준으로 업로드용 Presigned URL을 생성합니다. 동일한 파일명이 이미 존재하면 409 에러를 반환합니다.")
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

    @Operation(summary = "S3 다운로드용 Presigned URL 발급", description = "로그인한 사용자가 소유한 파일에 대해서만 다운로드용 Presigned URL을 발급합니다. 파일 소유자가 아닐 경우 403 에러를 반환합니다.")
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

    @Operation(summary = "S3 업로드 완료 후 이력서 등록", description = "S3에 이력서가 업로드된 후, 해당 파일명을 통해 데이터베이스에 등록 요청을 보냅니다. 같은 파일명이 존재하면 400 에러를 반환합니다.")
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
            return ResponseEntity.badRequest().body("S3에 해당 파일이 존재하지 않거나 신뢰도 낮은 CV 입니다. (서버 로그 확인 필요)");
        }
    }

    @Operation(summary = "기존 이력서 삭제 후 재업로드 등록", description = "기존 이력서를 삭제하고, 새 파일명을 통해 S3에서 업로드된 이력서를 등록합니다. 삭제 또는 등록 과정에서 오류 발생 시 에러를 반환합니다.")
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

    @Operation(summary = "S3 이력서 파일명 변경", description = "지정한 기존 파일명을 새로운 파일명으로 변경하고, 해당 변경 사항을 데이터베이스에도 반영합니다. 파일이 없거나 권한이 없을 경우 400 에러를 반환합니다.")
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
