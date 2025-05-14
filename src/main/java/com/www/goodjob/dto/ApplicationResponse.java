package com.www.goodjob.dto;

import com.www.goodjob.enums.ApplicationStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {
    private Long applicationId;
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private LocalDate applyEndDate;
    private ApplicationStatus applyStatus;
    private String note;
    private LocalDateTime createdAt;
}