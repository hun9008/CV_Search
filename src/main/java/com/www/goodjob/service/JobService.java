package com.www.goodjob.service;

import com.www.goodjob.domain.Job;
import com.www.goodjob.dto.JobSearchResponse;
import com.www.goodjob.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;

    public Page<JobSearchResponse> searchJobs(String keyword, String jobType, String department, Pageable pageable) {
        Page<Job> jobs = jobRepository.searchJobs(keyword, jobType, department, pageable);
        return jobs.map(job -> JobSearchResponse.builder()
                .id(job.getId())
                .companyName(job.getCompanyName())
                .title(job.getTitle())
                .description(job.getDescription())
                .jobType(job.getJobType())
                .department(job.getDepartment())
                .url(job.getUrl())
                .createdAt(job.getCreatedAt())
                .build());
    }
}