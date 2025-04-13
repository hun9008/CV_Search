package com.www.goodjob.controller;

import com.www.goodjob.dto.JobSearchResponse;
import com.www.goodjob.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/jobs")
public class JobController {

    private final JobService jobService;

    @GetMapping("/search")
    public ResponseEntity<Page<JobSearchResponse>> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> jobType,          // ← 복수 선택 지원
            @RequestParam(required = false) List<String> experience,       // ← 이미 있음
            @PageableDefault(page = 0, size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<JobSearchResponse> result = jobService.searchJobs(keyword, jobType, experience, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/job-types")
    public ResponseEntity<List<String>> getJobTypes() {
        List<String> jobTypes = jobService.getAvailableJobTypes();
        return ResponseEntity.ok(jobTypes);
    }

    @GetMapping("/experience-types")
    public ResponseEntity<List<String>> getExperienceTypes() {
        List<String> experienceTypes = jobService.getAvailableExperienceTypes();
        return ResponseEntity.ok(experienceTypes);
    }
}
