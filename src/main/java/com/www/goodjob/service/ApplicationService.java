package com.www.goodjob.service;

import com.www.goodjob.domain.Application;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.ApplicationResponse;
import com.www.goodjob.dto.ApplicationUpdateRequest;
import com.www.goodjob.enums.ApplicationStatus;
import com.www.goodjob.repository.ApplicationRepository;
import com.www.goodjob.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;

    public void addApplication(User user, Long jobId) {
        if (applicationRepository.existsByUserIdAndJobId(user.getId(), jobId)) {
            throw new IllegalStateException("이미 해당 공고에 지원한 이력이 존재합니다.");
        }

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공고입니다."));

        Application application = Application.builder()
                .user(user)
                .job(job)
                .applyStatus(ApplicationStatus.준비중)
                .build();

        applicationRepository.save(application);
    }

    public List<ApplicationResponse> getApplications(User user) {
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

    public void updateApplicationByJobId(User user, Long jobId, ApplicationUpdateRequest dto) {
        Application app = applicationRepository.findByUserIdAndJobId(user.getId(), jobId)
                .orElseThrow(() -> new NoSuchElementException("해당 공고에 대한 지원 이력이 없습니다."));

        if (dto.getApplyStatus() != null) {
            app.setApplyStatus(dto.getApplyStatus());
        }
        if (dto.getNote() != null) {
            app.setNote(dto.getNote());
        }

        applicationRepository.save(app);
    }

    public void deleteApplicationByJobId(User user, Long jobId) {
        Application app = applicationRepository.findByUserIdAndJobId(user.getId(), jobId)
                .orElseThrow(() -> new NoSuchElementException("해당 공고에 대한 지원 이력이 없습니다."));

        applicationRepository.delete(app);
    }

}
