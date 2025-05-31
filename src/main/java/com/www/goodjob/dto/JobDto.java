package com.www.goodjob.dto;

import com.www.goodjob.domain.Favicon;
import com.www.goodjob.domain.Job;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class JobDto {

    private Long id;
    private List<RegionDto> regions;
    private String companyName;
    private String title;
    private String department;
    private String requireExperience;
    private String jobType;
    private String requirements;
    private String preferredQualifications;
    private String idealCandidate;
    private String jobDescription;
    private LocalDate applyStartDate;
    private LocalDate applyEndDate;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdatedAt;
    private LocalDateTime expiredAt;
    private LocalDateTime archivedAt;
    private String url;
    private String favicon;
    private String regionText;

    public static JobDto from(Job job) {
        List<RegionDto> regions = RegionDto.fromJob(job);

        return JobDto.builder()
                .id(job.getId())
                .regions(regions)
                .companyName(job.getCompanyName())
                .title(job.getTitle())
                .department(job.getDepartment())
                .requireExperience(job.getExperience())
                .jobType(job.getJobType())
                .requirements(job.getRequirements())
                .preferredQualifications(job.getPreferredQualifications())
                .idealCandidate(job.getIdealCandidate())
                .jobDescription(job.getJobDescription())
                .applyStartDate(job.getApplyStartDate())
                .applyEndDate(job.getApplyEndDate())
                .isPublic(job.getIsPublic())
                .createdAt(job.getCreatedAt())
                .lastUpdatedAt(job.getLastUpdatedAt())
                .expiredAt(job.getExpiredAt())
                .archivedAt(job.getArchivedAt())
                .url(job.getUrl())
                .favicon(job.getFavicon() != null ? job.getFavicon().getLogo() : null)
                .regionText(job.getRegionText())
                .build();
    }
}
