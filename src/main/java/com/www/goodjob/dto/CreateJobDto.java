package com.www.goodjob.dto;

import com.www.goodjob.domain.Job;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateJobDto {

    private String companyName;
    private String title;
    private String department;
    private String requireExperience;
    private String jobType;
    private String requirements;
    private String preferredQualifications;
    private String idealCandidate;
    private String jobDescription;
    private ArrayList<Long> jobRegions;
    private LocalDate applyStartDate;
    private LocalDate applyEndDate;
    private Boolean isPublic;
    private String rawJobsText;
    private String url;
    private String favicon;
    private String regionText;
    private Integer jobValidType=0;


    public Job toEntity() {
        Job job = new Job();
        job.setCompanyName(this.companyName);
        job.setTitle(this.title);
        job.setDepartment(this.department);
        job.setExperience(this.requireExperience);
        job.setJobType(this.jobType);
        job.setRequirements(this.requirements);
        job.setPreferredQualifications(this.preferredQualifications);
        job.setIdealCandidate(this.idealCandidate);
        job.setJobDescription(this.jobDescription);
        job.setApplyStartDate(this.applyStartDate);
        job.setApplyEndDate(this.applyEndDate);
        job.setIsPublic(this.isPublic != null ? this.isPublic : true);
        job.setRawJobsText(this.rawJobsText);
        job.setUrl(this.url);
        job.setRegionText(this.regionText);
        job.setJobValidType(this.jobValidType);
        job.setLastUpdatedAt(LocalDateTime.now());
        return job;
    }
}