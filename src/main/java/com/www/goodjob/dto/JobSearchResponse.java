package com.www.goodjob.dto;

import com.www.goodjob.domain.Job;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

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
    private String experience;
    private String url;
    private LocalDateTime createdAt;
    private List<RegionDto> regions; // 지역 반환 추가
}