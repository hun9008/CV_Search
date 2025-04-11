package com.www.goodjob.controller;

import com.www.goodjob.domain.JobUpdateStatus;
import com.www.goodjob.service.JobUpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/job-update")
public class JobUpdateController {

    private final JobUpdateService jobUpdateService;

    @GetMapping("/start")
    public ResponseEntity<String> startJobUpdate() {
        jobUpdateService.requestJobUpdate();
        return ResponseEntity.ok("Job update started.");
    }

    @GetMapping("/status")
    public ResponseEntity<JobUpdateStatus> getJobUpdateStatus() {
        JobUpdateStatus status = jobUpdateService.getLatestStatus();
        return ResponseEntity.ok(status);
    }
}
