package com.www.goodjob.domain;

import com.www.goodjob.enums.OAuthProvider;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_oauth", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider", "oauthId"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOAuth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 소셜 로그인만 사용하는 환경에서는 User와 1:1 매핑합니다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private OAuthProvider provider;

    @Column(nullable = false)
    private String oauthId;  // 외부 제공자에서 받은 사용자 ID
}
