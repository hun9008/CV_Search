package com.www.goodjob.dto;

import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ScoredJobDto extends JobDto {
    private double score;
    private double cosineScore;
    private double bm25Score;

    @Override
    public String getRawJobsText() {
        return "HIDE";
    }

    public static ScoredJobDto from(JobDto base, double score, double cosineScore, double bm25Score) {
        return ScoredJobDto.builder()
                .id(base.getId())
                .regions(base.getRegions())
                .companyName(base.getCompanyName())
                .title(base.getTitle())
                .department(base.getDepartment())
                .requireExperience(base.getRequireExperience())
                .jobType(base.getJobType())
                .requirements(base.getRequirements())
                .preferredQualifications(base.getPreferredQualifications())
                .idealCandidate(base.getIdealCandidate())
                .jobDescription(base.getJobDescription())
                .applyStartDate(base.getApplyStartDate())
                .applyEndDate(base.getApplyEndDate())
                .isPublic(base.getIsPublic())
                .createdAt(base.getCreatedAt())
                .lastUpdatedAt(base.getLastUpdatedAt())
                .expiredAt(base.getExpiredAt())
                .archivedAt(base.getArchivedAt())
//                .rawJobsText(null)
//                .rawJobsText(base.getRawJobsText())
                .url(base.getUrl())
                .favicon(base.getFavicon())
                .regionText(base.getRegionText())
                .score(score)
                .cosineScore(cosineScore)
                .bm25Score(bm25Score)
                .build();
    }
}