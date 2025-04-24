package com.www.goodjob.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 공고 고유 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id") // 외래 키 컬럼 이름
    private Region region;

    @Column(name = "company_name")
    private String companyName; // 회사 이름

    private String title; // 채용 공고 제목

    private String department; // 부서명

    @Column(name = "require_experience")
    private String experience; // 요구 경력 ["경력무관", "신입", "경력"]

    @Column(name = "job_type")
    private String jobType; // 근무 유형 ["정규직", "계약직", "인턴", "아르바이트", "프리랜서", "파견직"]

    @Column(columnDefinition = "TEXT")
    private String requirements; // 필수 요구 조건

    @Column(name = "preferred_qualifications", columnDefinition = "TEXT")
    private String preferredQualifications; // 우대 조건

    @Column(name = "ideal_candidate", columnDefinition = "TEXT")
    private String idealCandidate; // 인재상

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String description; // 직무 기술서

    @Column(name = "apply_start_date")
    private Date applyStartDate; // 채용 시작일 (회사 입장)

    @Column(name = "apply_end_date")
    private Date applyEndDate; // 채용 마감일 (회사 입장)

    @Column(name = "is_public")
    private Boolean isPublic; // 사용자에게 노출 여부 (FALSE 시 숨김)

    @Column(name = "created_at")
    private LocalDateTime createdAt; // 생성 일자 (서버 입장)

    @Column(name = "last_updated_at")
    private LocalDateTime lastUpdatedAt; // 마지막 수정 일자 (서버 입장)

    @Column(name = "expired_at")
    private LocalDateTime expiredAt; // 공고 내려간 시간 (서버 입장)

    @Column(name = "archived_at")
    private LocalDateTime archivedAt; // 관리자 또는 배치에 의해 숨겨진 시간

    @Column(name = "raw_jobs_text", columnDefinition = "TEXT", nullable = false)
    private String rawJobsText; // 전체 원문 텍스트 (크롤링 원본)

    @Column(columnDefinition = "TEXT")
    private String url; // 공고 상세보기 링크 (공식 페이지)

    @Column(columnDefinition = "TEXT")
    private String favicon;

    @Column(name = "region_text")
    private String regionText;
}
