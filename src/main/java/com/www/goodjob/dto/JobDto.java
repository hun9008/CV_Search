package com.www.goodjob.dto;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.Region;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class JobDto {
    private Long id;
    private Region region;
    private String companyName;
    private String title;
    private String department;
    private String requireExperience;
    private String jobType;
    private String requirements;
    private String preferredQualifications;
    private String idealCandidate;
    private String jobDescription;
    private Date applyStartDate;
    private Date applyEndDate;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdatedAt;
    private LocalDateTime expiredAt;
    private LocalDateTime archivedAt;
    private String rawJobsText;
    private String url;
    private String favicon;
    private String regionText;

    public static JobDto from(Job job) {
        return JobDto.builder()
                .id(job.getId())
                .region(job.getRegion())
                .companyName(job.getCompanyName())
                .title(job.getTitle())
                .department(job.getDepartment())
                .requireExperience(job.getExperience())
                .jobType(job.getJobType())
                .requirements(job.getRequirements())
                .preferredQualifications(job.getPreferredQualifications())
                .idealCandidate(job.getIdealCandidate())
                .jobDescription(job.getDescription())
                .applyStartDate(job.getApplyStartDate())
                .applyEndDate(job.getApplyEndDate())
                .isPublic(job.getIsPublic())
                .createdAt(job.getCreatedAt())
                .lastUpdatedAt(job.getLastUpdatedAt())
                .expiredAt(job.getExpiredAt())
                .archivedAt(job.getArchivedAt())
                .rawJobsText(job.getRawJobsText())
                .url(job.getUrl())
                .favicon(job.getFavicon())
                .regionText(job.getRegionText())
                .build();
    }
}
