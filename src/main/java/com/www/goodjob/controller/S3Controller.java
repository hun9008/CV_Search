package com.www.goodjob.controller;

import com.www.goodjob.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/s3")
public class S3Controller {

    private final S3Service s3Service;

    @GetMapping("/presigned-url")
    public ResponseEntity<String> getPresignedUrl(@RequestParam String fileName) {
        String url = s3Service.generatePresignedUrl(fileName);
        return ResponseEntity.ok(url);
    }

    @PostMapping("/confirm-upload")
    public ResponseEntity<String> confirmUpload(
            @RequestParam Long userId,
            @RequestParam String fileName
    ) {
        boolean saved = s3Service.saveCvIfUploaded(userId, fileName);
        if (saved) {
            return ResponseEntity.ok("CV 정보가 저장되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("S3에 해당 파일이 존재하지 않습니다.");
        }
    }
}