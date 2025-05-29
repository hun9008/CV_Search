package com.www.goodjob.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.*;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.RegionGroupDto;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.JobValidTypeRepository;
import com.www.goodjob.repository.RegionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @InjectMocks
    private JobService jobService;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private SearchLogService searchLogService;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private RegionRepository regionRepository;

    @Mock
    private JobValidTypeRepository jobValidTypeRepository;

    @BeforeEach
    void setup() {
        // fastapiHost 값을 강제로 설정
        ReflectionTestUtils.setField(jobService, "fastapiHost", "http://localhost:8000");
    }

    @Test
    void searchJobs_withFilters_returnsPagedResults() {
        // given
        String keyword = "백엔드";
        List<String> jobTypes = List.of("정규직");
        List<String> experienceFilters = List.of("신입");
        List<String> sidoFilters = List.of("서울");
        List<String> sigunguFilters = List.of("강남구");
        Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());
        User mockUser = new User(); // 최소 구조만 사용

        Region region = new Region();
        region.setSido("서울");
        region.setSigungu("강남구");

        JobRegion jobRegion = new JobRegion();
        jobRegion.setRegion(region);

        Job job = new Job();
        job.setId(1L);
        job.setExperience("신입/경력");
        job.setJobType("정규직");
        job.setJobRegions(List.of(jobRegion));
        job.setFavicon(new Favicon(null, "some-domain", "base64string"));

        when(jobRepository.searchJobsWithRegion(eq(keyword), any())).thenReturn(List.of(job));

        // when
        Page<JobDto> result = jobService.searchJobs(
                keyword, jobTypes, experienceFilters, sidoFilters, sigunguFilters, pageable, mockUser
        );

        // then
        assertEquals(1, result.getTotalElements());
        assertEquals("정규직", result.getContent().get(0).getJobType());
        verify(searchLogService).saveSearchLog(eq(keyword), eq(mockUser));
    }

    @Test
    void searchJobs_withoutKeywordOrUser_doesNotLog() {
        // given
        Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());

        // keyword와 user가 null일 때, jobRepository에서 빈 리스트를 반환하도록 설정
        when(jobRepository.searchJobsWithRegion(null, pageable.getSort()))
                .thenReturn(List.of());

        // when
        Page<JobDto> result = jobService.searchJobs(
                null,   // keyword
                null,   // jobTypes
                null,   // experienceFilters
                null,   // sidoFilters
                null,   // sigunguFilters
                pageable,
                null    // user
        );

        // then
        assertNotNull(result);
        assertEquals(0, result.getTotalElements());

        // searchLogService가 호출되지 않았는지 검증
        verify(searchLogService, never()).saveSearchLog(any(), any());
    }


    @Test
    void getMatchingExperienceCategories() {
    }

    @Test
    void getMatchingJobTypes() {
    }

    @Test
    void getAvailableJobTypes_returnsStaticList() {
        List<String> expected = List.of("정규직", "계약직", "인턴");

        // 정적 메서드이므로 따로 mock하지 않고, 실제와 비교
        List<String> result = jobService.getAvailableJobTypes();

        assertNotNull(result);
        assertTrue(result.containsAll(expected)); // 값이 포함되어 있는지
    }

    @Test
    void getAvailableExperienceTypes_returnsStaticList() {
        List<String> expected = List.of("신입", "경력", "경력무관");

        List<String> result = jobService.getAvailableExperienceTypes();

        assertNotNull(result);
        assertTrue(result.containsAll(expected));
    }

    @Test
    void getGroupedRegions_returnsGroupedResults() {
        // given
        Region r1 = new Region();
        r1.setSido("서울");
        r1.setSigungu("강남구");

        Region r2 = new Region();
        r2.setSido("서울");
        r2.setSigungu("서초구");

        Region r3 = new Region();
        r3.setSido("경기");
        r3.setSigungu("수원시");

        when(regionRepository.findAllRegions()).thenReturn(List.of(r1, r2, r3));

        // when
        List<RegionGroupDto> result = jobService.getGroupedRegions();

        // then
        assertEquals(2, result.size()); // 서울, 경기

        RegionGroupDto seoul = result.stream()
                .filter(r -> r.getSido().equals("서울"))
                .findFirst()
                .orElseThrow();

        assertEquals(List.of("강남구", "서초구"), seoul.getSigunguList());
        verify(regionRepository, atLeastOnce()).findAllRegions();
    }

    @Test
    void deleteJob_successfulCall_returnsMessage() {
        Long jobId = 123L;
        String expectedUrl = "http://localhost:8000/delete-job?job_id=123";

        // doNothing은 기본값이므로 따로 설정 X
        doNothing().when(restTemplate).delete(expectedUrl);

        String result = jobService.deleteJob(jobId);

        assertEquals("Job 123 deleted from Elasticsearch and updated in RDB.", result);
        verify(restTemplate).delete(expectedUrl);
    }

    @Test
    void deleteJob_apiFails_throwsRuntimeException() {
        Long jobId = 456L;
        String expectedUrl = "http://localhost:8000/delete-job?job_id=456";

        doThrow(new RuntimeException("FastAPI 연결 실패"))
                .when(restTemplate).delete(expectedUrl);

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            jobService.deleteJob(jobId);
        });

        assertTrue(thrown.getMessage().contains("FastAPI 요청 실패"));
        verify(restTemplate).delete(expectedUrl);
    }

    @Test
    void deleteJobWithValidType_shouldNotDeleteWhenValidTypeIsZero() {
        // given
        Long jobId = 456L;
        Integer validType = 0;
        String expectedUrl = "http://localhost:8000/delete-job?job_id=456";

        // when
        jobService.deleteJobWithValidType(jobId, validType);

        // then
        verify(restTemplate, never()).delete(expectedUrl); // 삭제가 일어나지 않아야 함
    }

    @Test
    void deleteJobWithValidType_shouldDeleteWhenValidTypeIsNotZero() {
        // given
        Long jobId = 456L;
        Integer validType = 1;
        String expectedUrl = "http://localhost:8000/delete-job?job_id=456";

        // when
        jobService.deleteJobWithValidType(jobId, validType);

        // then
        verify(restTemplate).delete(expectedUrl); // 삭제가 일어나야함
    }
}