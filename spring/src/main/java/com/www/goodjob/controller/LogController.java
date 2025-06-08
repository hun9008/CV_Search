package com.www.goodjob.controller;

import com.www.goodjob.enums.EventType;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.JobLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "로깅 API", description = "공고 노출 및 클릭 로그 기록")
@RestController
@RequiredArgsConstructor
@RequestMapping("/log")
public class LogController {

    private final JobLogService jobLogService;

    @PostMapping("/event")
    @Operation(
            summary = "공고 이벤트 로깅",
            description = "유저가 공고를 노출(impression)하거나 클릭(click)했을 때 해당 이벤트를 기록합니다.\n" +
                    "userId는 인증 정보를 통해 자동 추출되며, jobId와 event(impression 또는 click)를 전달합니다."
    )
    public ResponseEntity<Void> logJobEvent(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Long jobId,
            @RequestParam String event)
    {
        Long userId = userDetails.getId();
        EventType eventType = EventType.valueOf(event);
        jobLogService.logEvent(userId, jobId, eventType);
        return ResponseEntity.ok().build();
    }
}
