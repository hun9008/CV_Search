package com.www.goodjob.controller;

import com.www.goodjob.domain.User;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.security.JwtTokenProvider;
import com.www.goodjob.service.AuthService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth API", description = "OAuth 로그인 및 인증 관련 API")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final AuthService authService;

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Operation(summary = "OAuth 로그인 URL 요청", description = """
            provider 파라미터로 소셜 로그인 방식 선택 (예: google, kakao) /
            프론트는 `/auth/login?provider=kakao` 호출 후 302 리다이렉트된 URL로 이동하면 됨 /
            (예: window.location.href = 해당 주소)
            """)
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

    @Operation(summary = "accessToken 재발급 요청", description = """
            쿠키에 저장된 refresh_token을 기반으로 accessToken을 재발급함 /
            프론트는 localStorage에 저장해서 이후 API 요청에 사용하면 됨
            """)
    // accessToken 재발급
    @PostMapping("/token/refresh")
    public ResponseEntity<?> refreshAccessToken(@CookieValue(value = "refresh_token", required = false) String refreshToken) {
        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing refresh token");
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        String newAccessToken = jwtTokenProvider.generateAccessToken(email);

        return ResponseEntity.ok(Collections.singletonMap("accessToken", newAccessToken));
    }

    @Operation(summary = "accessToken + firstLogin 여부 반환", description = """
            소셜 로그인 완료 후 프론트가 호출하는 엔드포인트 /
            쿠키에서 refresh_token을 읽고 email, accessToken과 최초 로그인 여부 반환
            """)
    // callback-endpoint에서 accessToken과 firstLogin 여부 반환
    @GetMapping("/callback-endpoint")
    public ResponseEntity<?> handleCallback(@CookieValue(value = "refresh_token", required = false) String refreshToken) {
        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "유효하지 않은 refresh token"));
        }

        String email = jwtTokenProvider.getEmail(refreshToken);

        // 단순히 DB에 유저가 없으면 새 유저로 간주 (에러 아님)
        String newAccessToken = jwtTokenProvider.generateAccessToken(email);
        boolean isFirstLogin = !userRepository.existsByEmail(email);

        return ResponseEntity.ok(Map.of(
                "email", email,
                "accessToken", newAccessToken,
                "firstLogin", isFirstLogin
        ));
    }


    @Operation(summary = "로그아웃 (refresh_token 쿠키 제거)", description = """
            refresh_token 삭제하여 로그아웃 처리함 /
            프론트는 localStorage에 있는 accessToken도 함께 제거해야 함
            """)
    // 로그아웃 (refresh_token 쿠키 제거)
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie deleteCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());

        return ResponseEntity.ok(Map.of("message", "로그아웃 되었습니다."));
    }

    @Operation(
            summary = "회원 탈퇴 (refresh_token + 사용자 정보 삭제)",
            description = """
                    사용자 계정을 삭제하고 refresh_token 쿠키도 제거함 /
                    프론트는 localStorage의 accessToken도 제거해야 함 /
                    req = 🔐 Authorization: Bearer <accessToken> 필요
                    """
    )
    @DeleteMapping("/withdraw")
    public ResponseEntity<?> withdraw(HttpServletResponse response,
                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();

        authService.withdraw(user); // 서비스 계층에서 트랜잭션 내 삭제

        // 쿠키 제거
        ResponseCookie deleteCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());

        return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었고, 로그아웃 처리되었습니다."));
    }


    @Operation(summary = "마스터 accessToken 발급 (관리자용)", description = """
            테스트용 masterKey 입력 시 관리자용 accessToken을 반환함 /
            Swagger Authorize에 넣고 인증된 API 테스트 가능
            """)
    @PostMapping("/master-token")
    public ResponseEntity<?> issueMasterToken(@RequestParam String key) {
        if (!"masterKey".equals(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid master key");
        }

        // 관리자로 간주될 마스터 유저 이메일
        String email = "testadmin@goodjob.com";

        // AccessToken만 발급
        String accessToken = jwtTokenProvider.generateAccessToken(email);
        return ResponseEntity.ok(Map.of("accessToken", accessToken));
    }

}
