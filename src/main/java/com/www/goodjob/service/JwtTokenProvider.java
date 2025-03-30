package com.www.goodjob.service;

import com.www.goodjob.security.OAuth2Attribute;
import com.www.goodjob.enums.OAuthProvider;
import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

@Component
public class JwtTokenProvider {

    private final long ACCESS_TOKEN_VALID_TIME = 1000L * 60 * 10;  // 10분
    private final long REFRESH_TOKEN_VALID_TIME = 1000L * 60 * 60 * 24 * 30 * 3; // 3개월

    private final String secretKey;

    // 명시적 생성자: @Value를 통해 주입받고 인코딩 처리
    public JwtTokenProvider(@Value("${jwt.secretKey:my-secret-key}") String secretKey) {
        this.secretKey = Base64.getEncoder().encodeToString(secretKey.getBytes());
    }

    /**
     * Access Token 생성
     */
    public String generateAccessToken(String email) {
        long now = System.currentTimeMillis();
        Date validity = new Date(now + ACCESS_TOKEN_VALID_TIME);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(now))
                .setExpiration(validity)
                .signWith(SignatureAlgorithm.HS256, secretKey)
                .compact();
    }

    /**
     * Refresh Token 생성
     */
    public String generateRefreshToken(String email) {
        long now = System.currentTimeMillis();
        Date validity = new Date(now + REFRESH_TOKEN_VALID_TIME);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(now))
                .setExpiration(validity)
                .signWith(SignatureAlgorithm.HS256, secretKey)
                .compact();
    }

    /**
     * 토큰 유효성 검증
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .setSigningKey(secretKey)
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * 토큰에서 email 추출
     */
    public String getEmail(String token) {
        return Jwts.parser()
                .setSigningKey(secretKey)
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * OAuth2User의 정보를 분기 처리하여 OAuthUserInfo 객체 생성 (구글, 카카오)
     */
    public OAuthUserInfo extractUserInfo(OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String provider = attributes.containsKey("kakao_account") ? "kakao" : "google";
        OAuth2Attribute oAuth2Attribute = OAuth2Attribute.of(provider, attributes);

        return OAuthUserInfo.builder()
                .email(oAuth2Attribute.getEmail())
                .name(oAuth2Attribute.getName())
                .picture(oAuth2Attribute.getPicture())
                .build();
    }

    /**
     * OAuth2User에서 제공자 판별
     */
    public OAuthProvider extractProvider(OAuth2User oAuth2User) {
        if (oAuth2User.getAttributes().containsKey("kakao_account")) {
            return OAuthProvider.KAKAO;
        }
        return OAuthProvider.GOOGLE;
    }

    /**
     * JwtAuthFilter 인스턴스 생성 (SecurityConfig에서 사용)
     */
    public com.www.goodjob.security.JwtAuthFilter jwtAuthFilter() {
        return new com.www.goodjob.security.JwtAuthFilter(this);
    }
}
