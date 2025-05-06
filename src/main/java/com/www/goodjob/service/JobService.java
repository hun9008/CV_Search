package com.www.goodjob.service;

import com.www.goodjob.domain.Job;
import com.www.goodjob.dto.JobSearchResponse;
import com.www.goodjob.enums.ExperienceCategory;
import com.www.goodjob.enums.JobTypeCategory;
import com.www.goodjob.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import com.www.goodjob.domain.User;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final RestTemplate restTemplate;
    private final SearchLogService searchLogService;

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    public Page<JobSearchResponse> searchJobs(String keyword, List<String> jobTypes, List<String> experienceFilters, Pageable pageable, User user) {
        if (user != null && keyword != null && !keyword.isBlank()) {
            searchLogService.saveSearchLog(keyword.trim(), user);
        }

        //  정렬 기준만 추출하여 전체 정렬된 리스트 조회
        Sort sort = pageable.getSort();
        List<Job> allJobs = jobRepository.searchJobs(keyword, sort);

        // Java 단에서 필터링 적용
        List<JobSearchResponse> filtered = allJobs.stream()
                .filter(job -> {
                    Set<String> expMatched = getMatchingExperienceCategories(job.getExperience());
                    Set<String> typeMatched = getMatchingJobTypes(job.getJobType());

                    Set<String> normExpFilter = experienceFilters == null ? Set.of() :
                            experienceFilters.stream().map(String::trim).collect(Collectors.toSet());
                    Set<String> normTypeFilter = jobTypes == null ? Set.of() :
                            jobTypes.stream().map(String::trim).collect(Collectors.toSet());

                    boolean experienceMatches = experienceFilters == null || experienceFilters.isEmpty()
                            || !Collections.disjoint(expMatched, normExpFilter);

                    boolean jobTypeMatches = jobTypes == null || jobTypes.isEmpty()
                            || !Collections.disjoint(typeMatched, normTypeFilter);

                    return experienceMatches && jobTypeMatches;
                })
                .map(job -> JobSearchResponse.builder()
                        .id(job.getId())
                        .companyName(job.getCompanyName())
                        .title(job.getTitle())
                        .description(job.getJobDescription())
                        .jobType(job.getJobType())
                        .experience(job.getExperience())
                        .url(job.getUrl())
                        .createdAt(job.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        // 페이징 적용
        int total = filtered.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<JobSearchResponse> paged = start >= total ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(paged, pageable, total);
    }

    public Set<String> getMatchingExperienceCategories(String rawText) {
        Set<String> matched = new HashSet<>();
        if (rawText == null) return matched;

        String text = rawText.toLowerCase();

        boolean hasNew = Pattern.compile("신입|entry[-\\s]?level|new\\s?hire|졸업생|학생").matcher(text).find();
        boolean hasExp = text.contains("경력") && !text.contains("신입");
        boolean isAmbiguous = text.contains("무관") || text.contains("irrelevant") ||
                text.contains("명시") || text.contains("구체") ||
                text.contains("직무별상이") || text.contains("다양") || text.contains("없음");

        if (isAmbiguous || (hasNew && hasExp)) {
            matched.addAll(List.of("신입", "경력", "경력무관"));
        } else if (hasNew) {
            matched.add("신입");
        } else if (hasExp) {
            matched.add("경력");
        }

        return matched;
    }

    public Set<String> getMatchingJobTypes(String rawJobType) {
        Set<String> matched = new HashSet<>();
        if (rawJobType == null) return matched;

        String text = rawJobType.toLowerCase();

        boolean isAmbiguous = text.contains("추정") || text.contains("명시") || text.contains("정보 없음") ||
                text.contains("etc") || text.contains("다양") || text.contains("등") ||
                text.contains("indeterminato") || text.contains("temps") || text.contains("possible") ||
                text.contains("full-time") || text.contains("part-time") || text.contains("temporary") ||
                text.contains("permanent") || text.contains("상시") || text.contains("형태");

        if (isAmbiguous) {
            matched.addAll(JobTypeCategory.asList());
            return matched;
        }

        for (JobTypeCategory type : JobTypeCategory.values()) {
            String keyword = type.name().replace("직", "").toLowerCase();
            if (text.contains(type.name().toLowerCase()) || text.contains(keyword)) {
                matched.add(type.name());
            }
        }

        return matched;
    }

    public List<String> getAvailableJobTypes() {
        return JobTypeCategory.asList();
    }

    public List<String> getAvailableExperienceTypes() {
        return ExperienceCategory.asList();
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

}
