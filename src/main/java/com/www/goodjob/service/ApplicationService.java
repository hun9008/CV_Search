package com.www.goodjob.service;

import com.www.goodjob.domain.Application;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.ApplicationCreateRequest;
import com.www.goodjob.dto.ApplicationResponse;
import com.www.goodjob.dto.ApplicationUpdateRequest;
import com.www.goodjob.enums.ApplicationStatus;
import com.www.goodjob.repository.ApplicationRepository;
import com.www.goodjob.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;

    public void addApplication(User user, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공고입니다"));

        Application application = Application.builder()
                .user(user)
                .job(job)
                .applyStatus(ApplicationStatus.준비중) // 기본값
                .build();

        applicationRepository.save(application);
    }

    public List<ApplicationResponse> getApplications(User user) {
        // fetch join으로 Job을 미리 로딩
        return applicationRepository.findByUser(user).stream()
                .map(app -> {
                    Job job = app.getJob();
                    return ApplicationResponse.builder()
                            .applicationId(app.getId())
                            .jobId(job.getId())
                            .jobTitle(job.getTitle())
                            .companyName(job.getCompanyName())
                            .applyStatus(app.getApplyStatus())
                            .note(app.getNote())
                            .createdAt(app.getCreatedAt())
                            .build();
                }).toList();
    }

    public void updateApplication(User user, Long applicationId, ApplicationUpdateRequest dto) {
        Application app = applicationRepository.findById(applicationId)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("해당 지원 이력을 찾을 수 없습니다."));

        if (dto.getApplyStatus() != null) app.setApplyStatus(dto.getApplyStatus());
        if (dto.getNote() != null) app.setNote(dto.getNote());

        applicationRepository.save(app);
    }

    public void deleteApplication(User user, Long applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("삭제할 수 없습니다."));
        applicationRepository.delete(app);
    }
}