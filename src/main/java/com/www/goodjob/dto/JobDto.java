package com.www.goodjob.dto;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.JobRegion;
import com.www.goodjob.domain.Region;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class JobDto {
    private Long id;
    private List<Region> regions;  // 여러 지역 포함
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
    private String rawJobsText;
    private String url;
    private String favicon;
    private String regionText;

    public static JobDto from(Job job) {
        // 연결된 모든 지역 가져오기
        List<Region> regions = job.getJobRegions().stream()
                .map(JobRegion::getRegion)
                .toList();

        // 전체 지역 텍스트 생성 (예: "서울 중구")
        String regionText = regions.stream()
                .map(r -> String.join(" ",
                        Optional.ofNullable(r.getSido()).orElse(""),
                        Optional.ofNullable(r.getSigungu()).orElse("")))
                .collect(Collectors.joining(", "));

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
                .rawJobsText(job.getRawJobsText())
                .url(job.getUrl())
                .favicon(job.getFavicon())
                .regionText(regionText)
                .build();
    }
}
