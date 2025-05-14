package com.www.goodjob.dto;

import com.www.goodjob.enums.ApplicationStatus;
import lombok.*;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationCreateRequest {
    private Long jobId;
    private ApplicationStatus applyStatus; // 선택, 없으면 "준비중"
}