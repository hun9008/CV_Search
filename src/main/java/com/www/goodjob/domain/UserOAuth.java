// UserOAuth.java
package com.www.goodjob.domain;

import com.www.goodjob.enums.OAuthProvider;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_oauth", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider", "oauthId"})
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOAuth {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private OAuthProvider provider;

    @Column(nullable = false)
    private String oauthId;  // 소셜 플랫폼에서의 사용자 ID

    @Lob
    private String accessToken;

    @Lob
    private String refreshToken;

    private LocalDateTime tokenExpiry;
}