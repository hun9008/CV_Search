package com.www.goodjob.dto;

import com.www.goodjob.enums.ApplicationStatus;
import lombok.*;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationUpdateRequest {
    private ApplicationStatus applyStatus;
    private String note;
}