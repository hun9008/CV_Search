package com.www.goodjob.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.User;
import com.www.goodjob.domain.UserOAuth;
import com.www.goodjob.enums.OAuthProvider;
import com.www.goodjob.repository.UserOAuthRepository;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.service.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final UserOAuthRepository userOAuthRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // OAuth2 configuration values for Google
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String googleRedirectUri;

    // OAuth2 configuration values for Kakao
    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.kakao.client-secret}")
    private String kakaoClientSecret;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @GetMapping("/login")
    public ResponseEntity<Map<String, String>> getLoginUrl(@RequestParam String provider) {
        String redirectUrl;
        if (provider.equalsIgnoreCase("google")) {
            redirectUrl = "https://accounts.google.com/o/oauth2/auth?client_id=" + googleClientId
                    + "&redirect_uri=" + googleRedirectUri
                    + "&response_type=code&scope=email profile";
        } else if (provider.equalsIgnoreCase("kakao")) {
            redirectUrl = "https://kauth.kakao.com/oauth/authorize?client_id=" + kakaoClientId
                    + "&redirect_uri=" + kakaoRedirectUri
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

    @GetMapping("/callback")
    public ResponseEntity<Map<String, String>> oauthCallback(@RequestParam String code, @RequestParam String provider) {
        try {
            String accessTokenUrl;
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();

            if (provider.equalsIgnoreCase("google")) {
                accessTokenUrl = "https://oauth2.googleapis.com/token";
                params.add("code", code);
                params.add("client_id", googleClientId);
                params.add("client_secret", googleClientSecret);
                params.add("redirect_uri", googleRedirectUri);
                params.add("grant_type", "authorization_code");
            } else if (provider.equalsIgnoreCase("kakao")) {
                accessTokenUrl = "https://kauth.kakao.com/oauth/token";
                params.add("code", code);
                params.add("client_id", kakaoClientId);
                params.add("redirect_uri", kakaoRedirectUri);
                params.add("grant_type", "authorization_code");
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Unsupported provider"));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(accessTokenUrl, request, String.class);

            JsonNode tokenJson = objectMapper.readTree(response.getBody());
            String accessToken = tokenJson.get("access_token").asText();

            // 사용자 정보 요청
            String userInfoUrl = provider.equalsIgnoreCase("google")
                    ? "https://www.googleapis.com/oauth2/v2/userinfo"
                    : "https://kapi.kakao.com/v2/user/me";

            HttpHeaders userInfoHeaders = new HttpHeaders();
            userInfoHeaders.setBearerAuth(accessToken);
            HttpEntity<Void> userInfoRequest = new HttpEntity<>(userInfoHeaders);
            ResponseEntity<String> userInfoResponse = restTemplate.exchange(userInfoUrl, HttpMethod.GET, userInfoRequest, String.class);
            JsonNode userInfo = objectMapper.readTree(userInfoResponse.getBody());

            String email, oauthId, name;
            if (provider.equalsIgnoreCase("google")) {
                email = userInfo.get("email").asText();
                oauthId = userInfo.get("id").asText();
                name = userInfo.get("name").asText();
            } else {
                JsonNode kakaoAccount = userInfo.get("kakao_account");
                email = kakaoAccount.get("email").asText();
                oauthId = userInfo.get("id").asText();
                name = kakaoAccount.get("profile").get("nickname").asText();
            }

            // 사용자 저장
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> userRepository.save(User.builder().email(email).name(name).build()));

            // OAuth 정보 저장
            userOAuthRepository.findByProviderAndOauthId(OAuthProvider.valueOf(provider.toUpperCase()), oauthId)
                    .orElseGet(() -> userOAuthRepository.save(
                            UserOAuth.builder()
                                    .user(user)
                                    .provider(OAuthProvider.valueOf(provider.toUpperCase()))
                                    .oauthId(oauthId)
                                    .accessToken(accessToken)
                                    .build()
                    ));

            // JWT 발급
            String jwt = jwtTokenProvider.createToken(email);
            return ResponseEntity.ok(Map.of("token", jwt));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
