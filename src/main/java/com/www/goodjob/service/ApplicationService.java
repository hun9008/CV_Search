package com.www.goodjob.service;

import com.www.goodjob.domain.Application;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.ApplicationDto;
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

    public void addApplication(User user, ApplicationDto dto) {
        Job job = jobRepository.findById(dto.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공고입니다"));

        Application.ApplicationBuilder builder = Application.builder()
                .user(user)
                .job(job)
                .applyStatus(dto.getApplyStatus() != null ? dto.getApplyStatus() : ApplicationStatus.준비중);

        applicationRepository.save(builder.build());
    }


    public List<Application> getApplications(User user) {
        return applicationRepository.findByUser(user);
    }

    public void updateApplication(User user, Long applicationId, ApplicationDto dto) {
        Application app = applicationRepository.findById(applicationId)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("해당 지원 이력을 찾을 수 없습니다."));

        if (dto.getApplyStatus() != null) app.setApplyStatus(dto.getApplyStatus());

        applicationRepository.save(app);
    }

    public void deleteApplication(User user, Long applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("삭제할 수 없습니다."));
        applicationRepository.delete(app);
    }
}

