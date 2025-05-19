package com.www.goodjob.service;

import com.www.goodjob.domain.Application;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.ApplicationResponse;
import com.www.goodjob.dto.ApplicationUpdateRequest;
import com.www.goodjob.repository.ApplicationRepository;
import com.www.goodjob.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.www.goodjob.enums.ApplicationStatus;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private ApplicationService applicationService;

    @Test
    void addApplication_whenAlreadyApplied_throwsException() {
        // given
        Long userId = 1L;
        Long jobId = 100L;
        User mockUser = new User();
        mockUser.setId(userId);

        when(applicationRepository.existsByUserIdAndJobId(userId, jobId)).thenReturn(true);

        // when & then
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                applicationService.addApplication(mockUser, jobId));

        assertEquals("이미 해당 공고에 지원한 이력이 존재합니다.", ex.getMessage());
    }

    @Test
    void addApplication_whenJobNotFound_throwsException() {
        // given
        Long userId = 1L;
        Long jobId = 200L;
        User mockUser = new User();
        mockUser.setId(userId);

        when(applicationRepository.existsByUserIdAndJobId(userId, jobId)).thenReturn(false);
        when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

        // when & then
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                applicationService.addApplication(mockUser, jobId));

        assertEquals("존재하지 않는 공고입니다.", ex.getMessage());
    }

    @Test
    void addApplication_successfullySavesApplication() {
        // given
        Long userId = 1L;
        Long jobId = 300L;

        User mockUser = new User();
        mockUser.setId(userId);

        Job mockJob = new Job();
        mockJob.setId(jobId);

        when(applicationRepository.existsByUserIdAndJobId(userId, jobId)).thenReturn(false);
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(mockJob));

        // when
        applicationService.addApplication(mockUser, jobId);

        // then
        verify(applicationRepository).save(any(Application.class));
    }

    @Test
    void getApplications_returnsListOfResponses() {
        // given
        User user = new User(); user.setId(1L);

        Job job = new Job();
        job.setId(100L);
        job.setTitle("백엔드 개발자");
        job.setCompanyName("GoodJob Inc.");

        Application app = Application.builder()
                .id(1L)
                .job(job)
                .user(user)
                .applyStatus(ApplicationStatus.지원)
                .note("이력서 제출 완료")
                .createdAt(LocalDateTime.now())
                .build();

        when(applicationRepository.findByUser(user)).thenReturn(List.of(app));

        // when
        List<ApplicationResponse> result = applicationService.getApplications(user);

        // then
        assertEquals(1, result.size());
        assertEquals(job.getId(), result.get(0).getJobId());
        assertEquals("백엔드 개발자", result.get(0).getJobTitle());
        verify(applicationRepository).findByUser(user);
    }

    @Test
    void updateApplicationByJobId_updatesStatusAndNote() {
        // given
        Long jobId = 100L;
        User user = new User(); user.setId(1L);

        Job job = new Job(); job.setId(jobId);

        Application app = Application.builder()
                .id(10L)
                .user(user)
                .job(job)
                .applyStatus(ApplicationStatus.준비중)
                .note("이전 메모")
                .build();

        ApplicationUpdateRequest dto = ApplicationUpdateRequest.builder()
                .applyStatus(ApplicationStatus.지원)
                .note("최종 제출")
                .build();

        when(applicationRepository.findByUserIdAndJobId(user.getId(), jobId)).thenReturn(Optional.of(app));

        // when
        applicationService.updateApplicationByJobId(user, jobId, dto);

        // then
        assertEquals(ApplicationStatus.지원, app.getApplyStatus());
        assertEquals("최종 제출", app.getNote());
        verify(applicationRepository).save(app);
    }

    @Test
    void updateApplicationByJobId_whenNotFound_throwsException() {
        Long jobId = 999L;
        User user = new User(); user.setId(1L);

        ApplicationUpdateRequest dto = ApplicationUpdateRequest.builder()
                .applyStatus(ApplicationStatus.서류전형)
                .note("제출했어요")
                .build();

        when(applicationRepository.findByUserIdAndJobId(user.getId(), jobId))
                .thenReturn(Optional.empty());

        // when & then
        NoSuchElementException ex = assertThrows(NoSuchElementException.class, () ->
                applicationService.updateApplicationByJobId(user, jobId, dto));

        assertTrue(ex.getMessage().contains("지원 이력이 없습니다"));
    }

    @Test
    void deleteApplicationByJobId_deletesSuccessfully() {
        // given
        Long jobId = 100L;
        Long userId = 1L;

        User user = new User();
        user.setId(userId);

        Job job = new Job();
        job.setId(jobId);

        Application app = Application.builder()
                .id(10L)
                .user(user)
                .job(job)
                .build();

        when(applicationRepository.findByUserIdAndJobId(userId, jobId)).thenReturn(Optional.of(app));

        // when
        applicationService.deleteApplicationByJobId(user, jobId);

        // then
        verify(applicationRepository).delete(app);
    }

    @Test
    void deleteApplicationByJobId_whenNotFound_throwsException() {
        // given
        Long jobId = 999L;
        Long userId = 1L;

        User user = new User();
        user.setId(userId);

        when(applicationRepository.findByUserIdAndJobId(userId, jobId)).thenReturn(Optional.empty());

        // when & then
        NoSuchElementException ex = assertThrows(NoSuchElementException.class, () ->
                applicationService.deleteApplicationByJobId(user, jobId));

        assertEquals("해당 공고에 대한 지원 이력이 없습니다.", ex.getMessage());
    }
}