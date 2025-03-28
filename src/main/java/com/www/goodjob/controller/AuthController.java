package com.www.goodjob.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    @GetMapping("/login")
    public ResponseEntity<Map<String, String>> getLoginUrl(@RequestParam String provider) {
        String redirectUrl = "https://accounts.google.com/o/oauth2/auth?client_id=your_client_id"
                + "&redirect_uri=https://yourapp.com/auth/callback"
                + "&response_type=code&scope=email profile";
        return ResponseEntity.ok(Map.of("login_url", redirectUrl));
    }

    @GetMapping("/me")
    public ResponseEntity<String> getUserInfo() {
        // 추후 JWT 인증 후 사용자 정보 응답
        return ResponseEntity.ok("user info");
    }
}