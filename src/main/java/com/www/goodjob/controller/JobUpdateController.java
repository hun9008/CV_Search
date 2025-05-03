package com.www.goodjob.controller;

import com.www.goodjob.domain.JobUpdateStatus;
import com.www.goodjob.service.JobUpdateService;
import io.swagger.v3.oas.annotations.Operation;
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

    @Operation(summary = "RDB에 저장된 job 데이터 vectorization", description = "FastAPI 서버로 job update 요청을 보내 백그라운드로 실행됨. 바로 성공반환." +
            "RDB에 저장된 job을 모두 vectorization 하여 ES에 저장." +
            "중복 데이터는 건너뛰며 하나의 job을 vectorization할때에도 사용가능.")
    @GetMapping("/start")
    public ResponseEntity<String> startJobUpdate() {
        jobUpdateService.requestJobUpdate();
        return ResponseEntity.ok("Job update started.");
    }

    @Operation(summary = "백그라운드로 실행되고 있는 업데이트 작업 상태 조회", description = "job-update/start에 대한 처리 상태 조회." +
            "IN PROGRESS, COMPLETED, FAILED 중 하나의 상태 가진다.")
    @GetMapping("/status")
    public ResponseEntity<JobUpdateStatus> getJobUpdateStatus() {
        JobUpdateStatus status = jobUpdateService.getLatestStatus();
        return ResponseEntity.ok(status);
    }
}
