package com.www.goodjob.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "satisfaction_score", nullable = false)
    private int satisfactionScore;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "last_updated_at")
    @UpdateTimestamp
    private LocalDateTime lastUpdatedAt;
}