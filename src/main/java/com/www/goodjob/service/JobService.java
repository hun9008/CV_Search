package com.www.goodjob.service;

import com.www.goodjob.domain.Job;
import com.www.goodjob.dto.JobSearchResponse;
import com.www.goodjob.enums.JobTypeCategory;
import com.www.goodjob.enums.ExperienceCategory;
import com.www.goodjob.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;

    /**
     * 키워드, 고용형태, 경력조건에 따라 필터링된 채용공고 목록을 페이지 단위로 반환
     */
    public Page<JobSearchResponse> searchJobs(String keyword, List<String> jobTypes, List<String> experienceFilters, Pageable pageable) {
        Page<Job> jobs = jobRepository.searchJobs(keyword, Pageable.unpaged());

        List<JobSearchResponse> allMatched = jobs.stream()
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
                .peek(job -> {
                    Set<String> matchedExp = getMatchingExperienceCategories(job.getExperience());
                    Set<String> matchedJobType = getMatchingJobTypes(job.getJobType());

                    // ===== 디버깅 로그 출력 =====
                    System.out.println("📌 [채용공고 제목] " + job.getTitle());
                    System.out.println("   ├ 원본 경력 텍스트: " + job.getExperience());
                    System.out.println("   ├ 매칭된 경력 카테고리: " + matchedExp);
                    System.out.println("   ├ 입력된 경력 필터: " + experienceFilters);
                    System.out.println("   ├ 원본 고용형태 텍스트: " + job.getJobType());
                    System.out.println("   ├ 매칭된 고용형태 카테고리: " + matchedJobType);
                    System.out.println("   └ 입력된 고용형태 필터: " + jobTypes);
                    System.out.println("-----------------------------------------------");
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

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allMatched.size());
        List<JobSearchResponse> paged = start <= end ? allMatched.subList(start, end) : List.of();

        return new PageImpl<>(paged, pageable, allMatched.size());
    }

    /**
     * 고용형태 카테고리 전체 목록 반환
     */
    public List<String> getAvailableJobTypes() {
        return JobTypeCategory.asList();
    }

    /**
     * 경력 카테고리 전체 목록 반환
     */
    public List<String> getAvailableExperienceTypes() {
        return ExperienceCategory.asList();
    }

    /**
     * 원본 경력 텍스트로부터 경력 카테고리 추출
     */
    public Set<String> getMatchingExperienceCategories(String rawText) {
        Set<String> matched = new HashSet<>();
        if (rawText == null) return matched;

        String text = rawText.toLowerCase();

        // 신입 키워드가 있을 경우
        if (Pattern.compile("신입|entry[-\\s]?level|new\\s?hire|졸업생|학생").matcher(text).find()) {
            matched.add(ExperienceCategory.신입.getLabel());
        }

        // 경력무관 키워드가 있을 경우 (전체 포함)
        if (text.contains("무관") || text.contains("irrelevant") || text.contains("경력무관") ||
                text.contains("명시되지않음") || text.contains("구체적으로명시되지않음") ||
                text.contains("직무별상이") || text.contains("다양함") || text.contains("언급없음")) {
            matched.add(ExperienceCategory.경력무관.getLabel());
            matched.add(ExperienceCategory.신입.getLabel());
            matched.add(ExperienceCategory.경력.getLabel());
        }

        // 경력 키워드가 있을 경우 (단, 신입과 중복 없을 때만)
        if (text.contains("경력") && !text.contains("신입")) {
            matched.add(ExperienceCategory.경력.getLabel());
        }

        return matched;
    }

    /**
     * 원본 고용형태 텍스트로부터 고용형태 카테고리 추출
     */
    public Set<String> getMatchingJobTypes(String rawJobType) {
        Set<String> matched = new HashSet<>();
        if (rawJobType == null) return matched;

        String text = rawJobType.toLowerCase();

        // 불분명하거나 추정된 형태일 경우 전체 포함
        boolean isAmbiguous = text.contains("추정") || text.contains("명시") || text.contains("정보 없음") ||
                text.contains("etc") || text.contains("다양") || text.contains("등") ||
                text.contains("indeterminato") || text.contains("temps") || text.contains("possible") ||
                text.contains("full-time") || text.contains("part-time") || text.contains("temporary") ||
                text.contains("permanent") || text.contains("상시") || text.contains("형태");

        if (isAmbiguous) {
            matched.addAll(JobTypeCategory.asList());
            return matched;
        }

        // 명확한 키워드 매칭
        for (JobTypeCategory type : JobTypeCategory.values()) {
            String keyword = type.name().replace("직", "");
            if (text.contains(type.name().toLowerCase()) || text.contains(keyword)) {
                matched.add(type.name());
            }
        }

        return matched;
    }
}
