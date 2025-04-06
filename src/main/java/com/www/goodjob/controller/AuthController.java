package com.www.goodjob.controller;

import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.service.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Collections;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    // 커스텀 로그인 페이지 (provider 파라미터 옵션 처리)
    @GetMapping("/login")
    public void loginPage(@RequestParam(value = "provider", required = false) String provider,
                          HttpServletResponse response) throws Exception {
        if (provider == null || provider.isEmpty()) {
            response.getWriter().write("로그인 페이지입니다. 사용 가능한 provider: google, kakao. 예: /auth/login?provider=kakao");
        } else {
            response.sendRedirect("/oauth2/authorization/" + provider.toLowerCase());
        }
    }

    @PostMapping("/token/refresh")
    public ResponseEntity<?> refreshAccessToken(@CookieValue(value = "refresh_token", required = false) String refreshToken) {
        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing refresh token");
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        String newAccessToken = jwtTokenProvider.generateAccessToken(email);

        return ResponseEntity.ok(Collections.singletonMap("accessToken", newAccessToken));
    }

    @GetMapping("/callback-endpoint")
    public ResponseEntity<?> handleCallback(@CookieValue(value = "refresh_token", required = false) String refreshToken) {
        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "유효하지 않은 refresh token"));
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        String newAccessToken = jwtTokenProvider.generateAccessToken(email);

        boolean isFirstLogin = !userRepository.existsByEmail(email);

        return ResponseEntity.ok(Map.of(
                "accessToken", newAccessToken,
                "firstLogin", isFirstLogin
        ));
    }



//    @GetMapping("/callback")
//    public String callbackPage() {
//        return """
//        <html>
//          <body>
//            <h1>✅ 리다이렉트 완료!</h1>
//            <button onclick="fetchToken()">Get Token</button>
//            <script>
//              async function fetchToken() {
//                const res = await fetch('/auth/callback-endpoint');
//                const data = await res.json();
//                alert(JSON.stringify(data));
//              }
//            </script>
//          </body>
//        </html>
//        """;
//    }

}
