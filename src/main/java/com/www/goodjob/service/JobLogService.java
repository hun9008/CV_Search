package com.www.goodjob.service;

import com.www.goodjob.domain.JobEventLog;
import com.www.goodjob.enums.EventType;
import com.www.goodjob.repository.JobEventLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JobLogService {

    private final JobEventLogRepository jobEventLogRepository;

    public void logEvent(Long userId, Long jobId, EventType eventType) {
        JobEventLog log = new JobEventLog();
        log.setUserId(userId);
        log.setJobId(jobId);
        log.setEvent(eventType);
        jobEventLogRepository.save(log);
    }
}
