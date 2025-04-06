package com.www.goodjob.controller;

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
    public ResponseEntity<?> handleCallback(HttpServletRequest request) {

        logger.info(">>> /auth/callback-endpoint 요청 수신");

        var session = request.getSession(false);
        if (session == null) {
            logger.warn("세션이 존재하지 않음.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "세션이 존재하지 않습니다."));
        }

        logger.info("세션 ID: {}", session.getId());
        session.getAttributeNames().asIterator().forEachRemaining(attr -> {
            logger.info("세션 속성: {} = {}", attr, session.getAttribute(attr));
        });

        String accessToken = (String) request.getSession().getAttribute("accessToken");
        Boolean firstLogin = (Boolean) request.getSession().getAttribute("firstLogin");

        // 세션에서 꺼낸 후 제거 (한 번만 사용)
        request.getSession().removeAttribute("accessToken");
        request.getSession().removeAttribute("firstLogin");

        if (accessToken == null || firstLogin == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "인증 정보가 없습니다."));
        }

        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "firstLogin", firstLogin
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
