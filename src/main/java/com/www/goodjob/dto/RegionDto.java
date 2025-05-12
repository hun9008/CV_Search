package com.www.goodjob.dto;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.JobRegion;
import lombok.*;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionDto {
    private String sido;
    private String sigungu;

    // Job 엔티티에서 RegionDto 리스트로 변환하는 정적 메서드
    public static List<RegionDto> fromJob(Job job) {
        return job.getJobRegions().stream()
                .map(JobRegion::getRegion)
                .map(region -> RegionDto.builder()
                        .sido(region.getSido())
                        .sigungu(region.getSigungu())
                        .build())
                .collect(Collectors.toList());
    }
}
