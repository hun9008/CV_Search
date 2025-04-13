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

    private String companyName; // 회사명

    private String title; // 직무 제목

    private String department; // 부서명

    private String experience; // 요구 경력 (신입, 경력)

    @Column(columnDefinition = "TEXT")
    private String description; // 상세 업무

    private String jobType; // 근무 유형 (정규직, 계약직)

    @Column(columnDefinition = "TEXT")
    private String preferredQualifications; // 우대 조건

    @Column(columnDefinition = "TEXT")
    private String idealCandidate; // 인재상

    @Column(columnDefinition = "TEXT")
    private String requirements; // 필수 요구 조건

    @Column(name = "raw_jobs_text", columnDefinition = "TEXT", nullable = false)
    private String rawJobsText; // 전체 원문 텍스트 (크롤링 원본)

    @Column(columnDefinition = "TEXT")
    private String url; // 공고 상세보기 링크 (공식 페이지)

    private Date startDate; // 공고 시작일 -> 4/12부터 채용시작

    private Date endDate; // 공고 마감일 -> 4/20 채용 마감

    private LocalDateTime createdAt; // 공고 등록일 -> 4/3에 goodJob에 공고가 등록됨

    // private LocalDateTime postedAt; // 공고 등록일 (createAt과 중복 되어 삭제)

    private Date expiresAt; // 공고 만료일 -> 4/30에 goodJob에서 공고가 내려감

    private Boolean isPublic; // 사용자에게 노출 여부 (FALSE 시 숨김)

    @Column(name = "archived_at", nullable = true)
    private LocalDateTime archivedAt ; // 관리자 또는 배치에 의해 숨겨진 날짜 -> 관리자가 임의로 공고 숨긴 날짜
}
