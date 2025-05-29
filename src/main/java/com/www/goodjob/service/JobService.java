package com.www.goodjob.service;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.Region;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.*;
import com.www.goodjob.enums.ExperienceCategory;
import com.www.goodjob.enums.JobTypeCategory;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.JobValidTypeRepository;
import com.www.goodjob.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.InterfaceAddress;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final RegionRepository regionRepository;
    private final RestTemplate restTemplate;
    private final SearchLogService searchLogService;
    private final JobValidTypeRepository jobValidTypeRepository;

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    public Page<JobDto> searchJobs(String keyword, List<String> jobTypes, List<String> experienceFilters,
                                   List<String> sidoFilters, List<String> sigunguFilters,
                                   Pageable pageable, User user) {
        if (user != null && keyword != null && !keyword.isBlank()) {
            searchLogService.saveSearchLog(keyword.trim(), user);
        }

        Sort sort = pageable.getSort();
        List<Job> allJobs = jobRepository.searchJobsWithRegion(keyword, sort);

        List<JobDto> filtered = allJobs.stream()
                .filter(job -> {
                    Set<String> expMatched = getMatchingExperienceCategories(job.getExperience());
                    Set<String> typeMatched = getMatchingJobTypes(job.getJobType());

                    Set<String> normExpFilter = experienceFilters == null ? Set.of() :
                            experienceFilters.stream().map(String::trim).collect(Collectors.toSet());
                    Set<String> normTypeFilter = jobTypes == null ? Set.of() :
                            jobTypes.stream().map(String::trim).collect(Collectors.toSet());
                    Set<String> normSido = sidoFilters == null ? Set.of() :
                            sidoFilters.stream().map(String::trim).collect(Collectors.toSet());
                    Set<String> normSigungu = sigunguFilters == null ? Set.of() :
                            sigunguFilters.stream().map(String::trim).collect(Collectors.toSet());

                    boolean experienceMatches = experienceFilters == null || experienceFilters.isEmpty()
                            || !Collections.disjoint(expMatched, normExpFilter);

                    boolean jobTypeMatches = jobTypes == null || jobTypes.isEmpty()
                            || !Collections.disjoint(typeMatched, normTypeFilter);

                    boolean regionMatches = (sidoFilters == null || sidoFilters.isEmpty())
                            && (sigunguFilters == null || sigunguFilters.isEmpty())
                            || job.getJobRegions().stream().anyMatch(jr -> {
                        String s = jr.getRegion().getSido();
                        String g = jr.getRegion().getSigungu();
                        boolean sidoOk = normSido.isEmpty() || normSido.contains(s);
                        boolean sigunguOk = normSigungu.isEmpty() || normSigungu.contains(g);
                        return sidoOk && sigunguOk;
                    });

                    return experienceMatches && jobTypeMatches && regionMatches;
                })
                .map(JobDto::from)
                .collect(Collectors.toList());

        int total = filtered.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<JobDto> paged = start >= total ? List.of() : filtered.subList(start, end);

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

    public List<RegionGroupDto> getGroupedRegions() {
        List<Region> allRegions = regionRepository.findAllRegions();
        Map<String, Set<String>> grouped = new HashMap<>();

        for (Region region : allRegions) {
            // 시군구가 null이면 시도 단위만 나타내는 행이므로 제외
            if (region.getSido() == null || region.getSigungu() == null) continue;

            grouped
                    .computeIfAbsent(region.getSido(), k -> new HashSet<>())
                    .add(region.getSigungu());
        }

        return grouped.entrySet().stream()
                .map(entry -> RegionGroupDto.builder()
                        .sido(entry.getKey())
                        .sigunguList(entry.getValue().stream()
                                .sorted()
                                .collect(Collectors.toList()))
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

    public String deleteJobWithValidType(Long jobId, Integer validType){

        try{
            if(validType !=0){
                deleteJob(jobId);
            }
            jobValidTypeRepository.upsertJobValidType(jobId,validType);
            return "Job " + jobId + " deleted from Elasticsearch and updated in RDB and ValidType.";
        }catch (Exception e){
            throw new RuntimeException("ValidTypeUpdate 및 삭제 실패 "+e.getMessage(),e);
        }
    }

    public List<ValidJobDto> findAllJobWithValidType() {
        return jobRepository.findAllWithValidType();
    }
}
