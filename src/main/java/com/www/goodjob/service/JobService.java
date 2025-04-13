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
import java.util.regex.Matcher;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;

    private static final Pattern REGEX_NUMERIC = Pattern.compile("\\d+");
    private static final Pattern REGEX_ABOVE = Pattern.compile("(\\d{1,2})\\s*년\\s*이상");
    private static final Pattern REGEX_RANGE = Pattern.compile("(\\d{1,2})\\s*[~\\-]\\s*(\\d{1,2})\\s*년");

    public Page<JobSearchResponse> searchJobs(String keyword, List<String> jobTypes, List<String> experienceFilters, Pageable pageable) {
        Page<Job> jobs = jobRepository.searchJobs(keyword, Pageable.unpaged());

        List<JobSearchResponse> allMatched = jobs.stream()
                .filter(job -> {
                    Set<String> expMatched = getMatchingExperienceCategories(job.getExperience());
                    Set<String> typeMatched = getMatchingJobTypes(job.getJobType());

                    Set<String> normExpMatched = expMatched.stream().map(String::trim).collect(Collectors.toSet());
                    Set<String> normExpFilter = experienceFilters == null ? Set.of() :
                            experienceFilters.stream().map(String::trim).collect(Collectors.toSet());

                    Set<String> normTypeMatched = typeMatched.stream().map(String::trim).collect(Collectors.toSet());
                    Set<String> normTypeFilter = jobTypes == null ? Set.of() :
                            jobTypes.stream().map(String::trim).collect(Collectors.toSet());

                    boolean experienceMatches = experienceFilters == null || experienceFilters.isEmpty()
                            || !Collections.disjoint(normExpMatched, normExpFilter);

                    boolean jobTypeMatches = jobTypes == null || jobTypes.isEmpty()
                            || !Collections.disjoint(normTypeMatched, normTypeFilter);

                    return experienceMatches && jobTypeMatches;
                })
                .peek(job -> {
                    Set<String> matchedExp = getMatchingExperienceCategories(job.getExperience());
                    Set<String> matchedJobType = getMatchingJobTypes(job.getJobType());

                    System.out.println("✅ TITLE: " + job.getTitle());
                    System.out.println("⭐ RAW TEXT[experience]: " + job.getExperience());
                    System.out.println("⭐ MATCHED[experience]: " + matchedExp);
                    System.out.println("⭐ FILTER[experience]: " + experienceFilters);
                    System.out.println("🚀 RAW TEXT[jobType]: " + job.getJobType());
                    System.out.println("🚀 MATCHED[jobType]: " + matchedJobType);
                    System.out.println("🚀 FILTER[jobType]: " + jobTypes);
                    System.out.println("-------");
                })
                .map(job -> JobSearchResponse.builder()
                        .id(job.getId())
                        .companyName(job.getCompanyName())
                        .title(job.getTitle())
                        .description(job.getDescription())
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

    public List<String> getAvailableJobTypes() {
        return JobTypeCategory.asList();
    }

    public List<String> getAvailableExperienceTypes() {
        return ExperienceCategory.asList();
    }

    private void addRangeAndAbove(Set<String> matched, int minYear) {
        if (minYear <= 3) matched.add(ExperienceCategory._1_3년.getLabel());
        if (minYear <= 6) matched.add(ExperienceCategory._4_6년.getLabel());
        if (minYear <= 9) matched.add(ExperienceCategory._7_9년.getLabel());
        if (minYear <= 15) matched.add(ExperienceCategory._10_15년.getLabel());
        if (minYear <= 20) matched.add(ExperienceCategory._16_20년.getLabel());
        matched.add(ExperienceCategory.경력무관.getLabel());
    }

    public Set<String> getMatchingExperienceCategories(String rawText) {
        Set<String> matched = new HashSet<>();
        if (rawText == null) return matched;

        String text = rawText.toLowerCase();

        if (Pattern.compile("신입|entry[-\\s]?level|new\\s?hire|졸업생|학생").matcher(text).find()) {
            matched.add(ExperienceCategory.신입.getLabel());
            matched.add(ExperienceCategory.경력무관.getLabel());
        }

        if (text.contains("무관") || text.contains("irrelevant") || text.contains("경력무관") ||
                text.contains("명시되지않음") || text.contains("구체적으로명시되지않음") ||
                text.contains("직무별상이") || text.contains("다양함") || text.contains("언급없음")) {
            matched.add(ExperienceCategory.경력무관.getLabel());
            matched.add(ExperienceCategory.신입.getLabel());
            addRangeAndAbove(matched, 1);
        }

        Matcher rangeMatcher = REGEX_RANGE.matcher(text);
        while (rangeMatcher.find()) {
            int start = Integer.parseInt(rangeMatcher.group(1));
            int end = Integer.parseInt(rangeMatcher.group(2));
            if (start <= 3 && end >= 1) matched.add(ExperienceCategory._1_3년.getLabel());
            if (start <= 6 && end >= 4) matched.add(ExperienceCategory._4_6년.getLabel());
            if (start <= 9 && end >= 7) matched.add(ExperienceCategory._7_9년.getLabel());
            if (start <= 15 && end >= 10) matched.add(ExperienceCategory._10_15년.getLabel());
            if (end >= 16) matched.add(ExperienceCategory._16_20년.getLabel());
            matched.add(ExperienceCategory.경력무관.getLabel());
        }

        Matcher aboveMatcher = REGEX_ABOVE.matcher(text);
        while (aboveMatcher.find()) {
            int minYear = Integer.parseInt(aboveMatcher.group(1));
            addRangeAndAbove(matched, minYear);
        }

        if (text.contains("경력") && !REGEX_NUMERIC.matcher(text.replaceAll("[()]", "")).find()) {
            addRangeAndAbove(matched, 1);
        }

        if (text.contains("경력") && !text.contains("년")) {
            matched.add(ExperienceCategory._1_3년.getLabel());
            matched.add(ExperienceCategory._4_6년.getLabel());
            matched.add(ExperienceCategory._7_9년.getLabel());
            matched.add(ExperienceCategory._10_15년.getLabel());
            matched.add(ExperienceCategory._16_20년.getLabel());
            matched.add(ExperienceCategory.경력무관.getLabel());
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
            String keyword = type.name().replace("직", "");
            if (text.contains(type.name().toLowerCase()) || text.contains(keyword)) {
                matched.add(type.name());
            }
        }

        return matched;
    }
}
