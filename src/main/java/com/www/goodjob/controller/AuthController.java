package com.www.goodjob.controller;

import com.www.goodjob.service.JwtTokenProvider;
import com.www.goodjob.domain.User;
import com.www.goodjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @GetMapping("/login")
    public ResponseEntity<Map<String, String>> getLoginUrl(@RequestParam String provider) {
        String redirectUrl;
        if (provider.equalsIgnoreCase("google")) {
            redirectUrl = "https://accounts.google.com/o/oauth2/auth?client_id=your_google_client_id"
                    + "&redirect_uri=https://yourapp.com/auth/callback"
                    + "&response_type=code&scope=email profile";
        } else if (provider.equalsIgnoreCase("kakao")) {
            redirectUrl = "https://kauth.kakao.com/oauth/authorize?client_id=your_kakao_rest_api_key"
                    + "&redirect_uri=https://yourapp.com/auth/callback"
                    + "&response_type=code&scope=account_email profile";
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported provider"));
        }
        return ResponseEntity.ok(Map.of("login_url", redirectUrl));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, String>> getUserInfo(@RequestHeader("Authorization") String tokenHeader) {
        String token = tokenHeader.replace("Bearer ", "");
        String email = jwtTokenProvider.getEmailFromToken(token);
        return ResponseEntity.ok(Map.of("email", email));
    }

    @PostMapping("/signUp")
    public ResponseEntity<String> signUp(@RequestHeader("Authorization") String tokenHeader,
                                         @RequestBody Map<String, String> body) {
        String token = tokenHeader.replace("Bearer ", "");
        String email = jwtTokenProvider.getEmailFromToken(token);
        String region = body.get("region");

        User user = userRepository.findByEmail(email).orElseThrow();
        user.setRegion(region);
        userRepository.save(user);

        return ResponseEntity.ok("Sign-up completed");
    }
}
