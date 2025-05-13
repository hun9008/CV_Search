package com.www.goodjob.dto;

import com.www.goodjob.enums.ApplicationStatus;
import lombok.*;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDto {
    private Long jobId;
    private ApplicationStatus applyStatus;
}

