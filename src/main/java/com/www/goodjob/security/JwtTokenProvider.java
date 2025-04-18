package com.www.goodjob.security;

import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.Base64;
import java.util.Date;

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

}
