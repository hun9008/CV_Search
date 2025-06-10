package com.www.goodjob.dto;

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
public class JobWithValidTypeDto {

    private Long id;
    private String companyName;
    private String title;
    private Integer jobValidType;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDate applyEndDate;
    private String url;


    public static JobWithValidTypeDto from(Job job) {
        List<RegionDto> regions = RegionDto.fromJob(job);
        return JobWithValidTypeDto.builder()
                .id(job.getId())
                .companyName(job.getCompanyName())
                .title(job.getTitle())
                .isPublic(job.getIsPublic())
                .createdAt(job.getCreatedAt())
                .applyEndDate(job.getApplyEndDate())
                .url(job.getUrl())
                .jobValidType(job.getJobValidType())
                .build();
    }
}
