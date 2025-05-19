package com.www.goodjob.service;

import com.www.goodjob.domain.JobUpdateStatus;
import com.www.goodjob.repository.JobUpdateStatusRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobUpdateServiceTest {

    @InjectMocks
    private JobUpdateService jobUpdateService;

    @Mock
    private JobUpdateStatusRepository jobUpdateStatusRepository;

    @Mock
    private RestTemplate restTemplate;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(jobUpdateService, "fastapiHost", "http://localhost:8000");
    }

    @Test
    void requestJobUpdate_onlyInitialStatusIsSaved() {
        // given
        ArgumentCaptor<JobUpdateStatus> captor = ArgumentCaptor.forClass(JobUpdateStatus.class);

        // when
        jobUpdateService.requestJobUpdate();

        // then
        verify(jobUpdateStatusRepository, atLeastOnce()).save(captor.capture());

        JobUpdateStatus first = captor.getAllValues().get(0);
        assertEquals("IN_PROGRESS", first.getStatus());
    }

    @Test
    void getLatestStatus_returnsStatusIfExists() {
        // given
        JobUpdateStatus status = new JobUpdateStatus();
        status.setStatus("COMPLETED");
        status.setRequestedAt(LocalDateTime.now());

        when(jobUpdateStatusRepository.findTopByOrderByRequestedAtDesc())
                .thenReturn(Optional.of(status));

        // when
        JobUpdateStatus result = jobUpdateService.getLatestStatus();

        // then
        assertEquals("COMPLETED", result.getStatus());
    }

    @Test
    void getLatestStatus_throwsExceptionIfNotExists() {
        when(jobUpdateStatusRepository.findTopByOrderByRequestedAtDesc())
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> jobUpdateService.getLatestStatus());
    }
}