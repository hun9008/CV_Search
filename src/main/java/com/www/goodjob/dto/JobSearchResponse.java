package com.www.goodjob.dto;

import lombok.*;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSearchResponse {
    private Long id;
    private String companyName;
    private String title;
    private String description;
    private String jobType;
    private String department;
    private String url;
    private LocalDateTime createdAt;
}