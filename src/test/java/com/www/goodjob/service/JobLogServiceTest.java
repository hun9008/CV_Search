package com.www.goodjob.service;

import com.www.goodjob.domain.JobEventLog;
import com.www.goodjob.enums.EventType;
import com.www.goodjob.repository.JobEventLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.mockito.Mockito.mock;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class JobLogServiceTest {

    private final JobEventLogRepository mockRepository = mock(JobEventLogRepository.class);
    private final JobLogService jobLogService = new JobLogService(mockRepository);

    @Test
    @DisplayName("logEvent() - 유저 ID, 잡 ID, 이벤트 타입이 로그에 저장되어야 함")
    void logEvent_savesCorrectLog() {
        // Given
        Long userId = 1L;
        Long jobId = 100L;
        EventType eventType = EventType.click;

        // When
        jobLogService.logEvent(userId, jobId, eventType);

        // Then
        ArgumentCaptor<JobEventLog> captor = ArgumentCaptor.forClass(JobEventLog.class);
        verify(mockRepository, times(1)).save(captor.capture());

        JobEventLog savedLog = captor.getValue();
        assertEquals(userId, savedLog.getUserId());
        assertEquals(jobId, savedLog.getJobId());
        assertEquals(eventType, savedLog.getEvent());
    }
}