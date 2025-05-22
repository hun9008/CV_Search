package com.www.goodjob.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 공고 고유 ID

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true ,fetch =FetchType.LAZY)
    private List<JobRegion> jobRegions = new ArrayList<>();

    @OneToOne(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true, fetch =FetchType.LAZY)
    private JobValidType jobValidType = new JobValidType();

    @Column(name = "company_name")
    private String companyName;

    private String title;

    private String department;

    @Column(name = "require_experience")
    private String experience;

    @Column(name = "job_type")
    private String jobType;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "preferred_qualifications", columnDefinition = "TEXT")
    private String preferredQualifications;

    @Column(name = "ideal_candidate", columnDefinition = "TEXT")
    private String idealCandidate;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "apply_start_date")
    private LocalDate applyStartDate; // ✅ DATE -> LocalDate

    @Column(name = "apply_end_date")
    private LocalDate applyEndDate; // ✅ DATE -> LocalDate

    @Column(name = "is_public")
    private Boolean isPublic;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_updated_at")
    private LocalDateTime lastUpdatedAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "raw_jobs_text", columnDefinition = "TEXT", nullable = false)
    private String rawJobsText;

    @Column(columnDefinition = "TEXT")
    private String url;

    @Column(columnDefinition = "TEXT")
    private String favicon;

    @Column(name = "region_text")
    private String regionText;
}
