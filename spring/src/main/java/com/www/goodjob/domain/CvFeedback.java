package com.www.goodjob.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "cv_feedback", uniqueConstraints = @UniqueConstraint(columnNames = {"recommend_score_id"}))
public class CvFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cv + Job 조합을 가진 추천 결과에 대한 외래 키
    @OneToOne
    @JoinColumn(name = "recommend_score_id", nullable = false, unique = true)
    private RecommendScore recommendScore;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String feedback;

    private boolean confirmed;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_updated_at", nullable = false)
    private LocalDateTime lastUpdatedAt = LocalDateTime.now();

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.lastUpdatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.lastUpdatedAt = LocalDateTime.now();
    }
}
