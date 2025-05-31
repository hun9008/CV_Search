package com.www.goodjob.service;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.JobRegion;
import com.www.goodjob.domain.Region;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.*;
import com.www.goodjob.enums.ExperienceCategory;
import com.www.goodjob.enums.JobTypeCategory;
import com.www.goodjob.repository.JobRegionRepository;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.RegionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final RegionRepository regionRepository;
    private final RestTemplate restTemplate;
    private final SearchLogService searchLogService;
    private final JobRegionRepository jobRegionRepository;

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    public Page<JobDto> searchJobs(String keyword, List<String> jobTypes, List<String> experienceFilters,
                                   List<String> sidoFilters, List<String> sigunguFilters,
                                   Pageable pageable, User user) {
        if (user != null && keyword != null && !keyword.isBlank()) {
            searchLogService.saveSearchLog(keyword.trim(), user);
        }

        // 경력무관 확장 처리
        List<String> expandedExperienceFilters = experienceFilters == null ? null :
                experienceFilters.stream()
                        .flatMap(filter -> filter.equals("경력무관")
                                ? Stream.of("경력무관", "신입", "경력")
                                : Stream.of(filter))
                        .distinct()
                        .toList();

        // 빈 리스트는 null로 변경 (IN 절에서 오류 방지)
        List<String> safeJobTypes = (jobTypes == null || jobTypes.isEmpty()) ? null : jobTypes;
        List<String> safeExperience = (expandedExperienceFilters == null || expandedExperienceFilters.isEmpty()) ? null : expandedExperienceFilters;
        List<String> safeSido = (sidoFilters == null || sidoFilters.isEmpty()) ? null : sidoFilters;
        List<String> safeSigungu = (sigunguFilters == null || sigunguFilters.isEmpty()) ? null : sigunguFilters;

        Page<Job> jobPage = jobRepository.searchJobsWithFilters(
                keyword,
                safeJobTypes,
                safeExperience,
                safeSido,
                safeSigungu,
                pageable
        );

        return jobPage.map(JobDto::from);
    }


    public List<String> getAvailableJobTypes() {
        return JobTypeCategory.asList();
    }

    public List<String> getAvailableExperienceTypes() {
        return ExperienceCategory.asList();
    }

    public List<RegionGroupDto> getGroupedRegions() {
        List<Region> allRegions = regionRepository.findAllRegions();
        Map<String, Set<String>> grouped = new HashMap<>();

        for (Region region : allRegions) {
            if (region.getSido() == null || region.getSigungu() == null) continue;

            grouped.computeIfAbsent(region.getSido(), k -> new HashSet<>())
                    .add(region.getSigungu());
        }

        return grouped.entrySet().stream()
                .map(entry -> RegionGroupDto.builder()
                        .sido(entry.getKey())
                        .sigunguList(entry.getValue().stream().sorted().collect(Collectors.toList()))
                        .build())
                .sorted(Comparator.comparing(RegionGroupDto::getSido))
                .collect(Collectors.toList());
    }

    public String deleteJob(Long jobId) {
        String url = fastapiHost + "/delete-job?job_id=" + jobId;
        try {
            restTemplate.delete(url);
            return "Job " + jobId + " deleted from Elasticsearch and updated in RDB.";
        } catch (Exception e) {
            throw new RuntimeException("FastAPI 요청 실패: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String deleteJobWithValidType(Long jobId, Integer validType) {
        try {
            deleteJob(jobId);
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job Id가 존재하지 않습니다."));
            job.setJobValidType(validType);
            job.setIsPublic(false);
            jobRepository.save(job);
            return "Job " + jobId + " deleted from Elasticsearch and updated in RDB and ValidType.";
        } catch (Exception e) {
            throw new RuntimeException("ValidTypeUpdate 및 삭제 실패 " + e.getMessage(), e);
        }
    }

    public List<ValidJobDto> findAllJobWithValidType() {
        return jobRepository.findAllWithValidType();
    }

    @Transactional
    public Job createOrUpdateJob(CreateJobDto dto) {
        Job job = dto.toEntity();
        job = jobRepository.save(job);

        for (Long regionId : dto.getJobRegions()) {
            Region region = regionRepository.findById(regionId)
                    .orElseThrow(() -> new RuntimeException("지역명 없음: " + regionId));
            JobRegion jobRegion = new JobRegion();
            jobRegion.setJob(job);
            jobRegion.setRegion(region);
            jobRegionRepository.save(jobRegion);
        }
        return job;
    }
}
