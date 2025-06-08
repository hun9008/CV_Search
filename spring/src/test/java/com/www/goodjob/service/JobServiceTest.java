package com.www.goodjob.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.domain.*;
import com.www.goodjob.dto.*;
import com.www.goodjob.repository.JobRegionRepository;
import com.www.goodjob.repository.JobRepository;
// import com.www.goodjob.repository.JobValidTypeRepository;
import com.www.goodjob.repository.RegionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

//    @Mock
//    private JobValidTypeRepository jobValidTypeRepository;

    @Mock
    private JobRegionRepository jobRegionRepository;

    @BeforeEach
    void setup() {
        // fastapiHost 값을 강제로 설정
        ReflectionTestUtils.setField(jobService, "fastapiHost", "http://localhost:8000");
    }

    @Test
    void searchJobs_withKeyword_callsFastApiAndReturnsResults() {
        // given
        String keyword = "백엔드";
        List<String> jobTypes = List.of("정규직");
        List<String> experienceFilters = List.of("경력무관"); // 확장 대상
        List<String> sidoFilters = List.of("서울");
        List<String> sigunguFilters = List.of("강남구");
        Pageable pageable = PageRequest.of(0, 10);
        User mockUser = new User();

        Long jobId = 1L;

        // FastAPI 응답 DTO
        JobSearchDto searchDto = new JobSearchDto();
        searchDto.setJobId(jobId);

        JobSearchResponse searchResponse = new JobSearchResponse();
        searchResponse.setResults(List.of(searchDto));

        // FastAPI mock
        when(restTemplate.postForEntity(
                eq("http://localhost:8000/search-es"),
                any(HttpEntity.class),
                eq(JobSearchResponse.class)
        )).thenReturn(new ResponseEntity<>(searchResponse, HttpStatus.OK));

        // JobRepository 응답
        Job job = new Job();
        job.setId(jobId);
        job.setJobType("정규직");
        job.setExperience("신입");
        job.setJobRegions(List.of());  // 간단화
        job.setFavicon(new Favicon(null, "domain", "base64"));

        when(jobRepository.findByIdInWithRegion(List.of(jobId))).thenReturn(List.of(job));

        // when
        Page<JobDto> result = jobService.searchJobs(
                keyword, jobTypes, experienceFilters, sidoFilters, sigunguFilters, pageable, mockUser
        );

        // then
        assertEquals(1, result.getTotalElements());
        assertEquals(jobId, result.getContent().getFirst().getId());
        assertEquals("정규직", result.getContent().getFirst().getJobType());

        verify(searchLogService).saveSearchLog(eq(keyword), eq(mockUser));
        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(JobSearchResponse.class));
        verify(jobRepository).findByIdInWithRegion(eq(List.of(jobId)));
    }

    @Test
    void searchJobs_withoutKeywordOrUser_doesNotLog() {
        // given
        Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());

        // keyword와 user가 null일 때, jobRepository에서 빈 리스트를 반환하도록 설정
        when(jobRepository.searchJobsWithFilters(
                eq(null),              // keyword
                eq(null),              // jobTypes
                eq(null),              // experiences
                eq(null),              // sidos
                eq(null),              // sigungus
                eq(pageable)
        )).thenReturn(Page.empty());

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
    void searchJobs_withKeyword_andEmptyFastApiResponse_returnsEmptyPage() {
        // given
        String keyword = "백엔드";
        Pageable pageable = PageRequest.of(0, 10);
        User mockUser = new User();

        // FastAPI returns empty result
        JobSearchResponse emptyResponse = new JobSearchResponse();
        emptyResponse.setResults(List.of());
        emptyResponse.setTotal(0);

        when(restTemplate.postForEntity(
                eq("http://localhost:8000/search-es"),
                any(HttpEntity.class),
                eq(JobSearchResponse.class)
        )).thenReturn(new ResponseEntity<>(emptyResponse, HttpStatus.OK));

        // when
        Page<JobDto> result = jobService.searchJobs(
                keyword, null, null, null, null, pageable, mockUser
        );

        // then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(restTemplate).postForEntity(anyString(), any(), eq(JobSearchResponse.class));
        verify(jobRepository, never()).findByIdInWithRegion(any());
    }

    @Test
    void searchJobs_withKeyword_andFastApiThrowsException_throwsRuntimeException() {
        // given
        String keyword = "데이터";
        Pageable pageable = PageRequest.of(0, 10);
        User mockUser = new User();

        when(restTemplate.postForEntity(
                anyString(),
                any(HttpEntity.class),
                eq(JobSearchResponse.class)
        )).thenThrow(new RestClientException("FastAPI 실패"));

        // then
        assertThrows(RuntimeException.class, () ->
                jobService.searchJobs(keyword, null, null, null, null, pageable, mockUser)
        );

        verify(restTemplate).postForEntity(anyString(), any(), eq(JobSearchResponse.class));
    }

    @Test
    void searchJobs_withKeyword_andFastApiResponseIsNull_returnsEmptyPage() {
        // given
        String keyword = "백엔드";
        Pageable pageable = PageRequest.of(0, 10);
        User mockUser = new User();

        // FastAPI returns null body
        ResponseEntity<JobSearchResponse> nullResponse = new ResponseEntity<>(null, HttpStatus.OK);

        when(restTemplate.postForEntity(
                eq("http://localhost:8000/search-es"),
                any(HttpEntity.class),
                eq(JobSearchResponse.class)
        )).thenReturn(nullResponse);

        // when
        Page<JobDto> result = jobService.searchJobs(keyword, null, null, null, null, pageable, mockUser);

        // then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(restTemplate).postForEntity(anyString(), any(), eq(JobSearchResponse.class));
        verify(jobRepository, never()).findByIdInWithRegion(any());
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
    void deleteJobWithValidType_성공() {
        // given
        Long jobId = 1L;
        Integer validType = 2;

        Job job = new Job();
        job.setId(jobId);
        job.setIsPublic(true);

        // deleteJob 호출 시 RestTemplate 내부 사용 시 mocking 필요
        // 예: restTemplate.delete("http://localhost:8000/delete-job?id=1");
        doNothing().when(restTemplate).delete(anyString());

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(jobRepository.save(any(Job.class))).thenReturn(job);

        // when
        String result = jobService.deleteJobWithValidType(jobId, validType);

        // then
        assertEquals("Job 1 deleted from Elasticsearch and updated in RDB and ValidType.", result);
        assertEquals(validType, job.getJobValidType());
        assertFalse(job.getIsPublic());

        verify(jobRepository).save(job);
        verify(restTemplate).delete(contains("/delete-job")); // deleteJob 내 호출이 있으면 확인
    }

    @Test
    void deleteJobWithValidType_존재하지않는Job_예외발생() {
        // given
        Long jobId = 999L;
        Integer validType = 3;

        doNothing().when(restTemplate).delete(anyString());
        when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

        // when & then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> jobService.deleteJobWithValidType(jobId, validType));

        assertTrue(exception.getMessage().contains("Job Id가 존재하지 않습니다."));
    }

    @Test
    void deleteJobWithValidType_deleteJob_예외발생시_RuntimeException() {
        // given
        Long jobId = 1L;
        Integer validType = 1;

        doThrow(new RuntimeException("삭제 실패")).when(restTemplate).delete(anyString());

        // deleteJob() 내부에서 위 에러가 발생한다고 가정
        // findById 호출까지 안 감

        // when & then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> jobService.deleteJobWithValidType(jobId, validType));

        assertTrue(exception.getMessage().contains("ValidTypeUpdate 및 삭제 실패"));
    }

    @Test
    void createOrUpdateJob_savesJobAndJobRegionsSuccessfully() {
        // given
        CreateJobDto dto = mock(CreateJobDto.class);

        Job job = new Job();
        job.setId(1L);
        ArrayList<Long> regionIds = new ArrayList<>(List.of(10L, 20L));

        when(dto.toEntity()).thenReturn(job);
        when(dto.getJobRegions()).thenReturn(regionIds);

        when(jobRepository.save(any(Job.class))).thenReturn(job);

        Region region1 = Region.builder().id(10L).sido("서울").sigungu("강남구").build();
        Region region2 = Region.builder().id(20L).sido("서울").sigungu("서초구").build();

        when(regionRepository.findById(10L)).thenReturn(java.util.Optional.of(region1));
        when(regionRepository.findById(20L)).thenReturn(java.util.Optional.of(region2));

        // when
        Job result = jobService.createOrUpdateJob(dto);

        // then
        assertNotNull(result);
        assertEquals(1L, result.getId());

        verify(jobRepository).save(any(Job.class));
        verify(regionRepository, times(2)).findById(anyLong());
        verify(jobRegionRepository, times(2)).save(any(JobRegion.class));
    }

    @Test
    void findAllJobWithValidType_returnsCorrectList() {
        // given
        Pageable pageable = PageRequest.of(0, 2);
        LocalDateTime createdAt = LocalDateTime.now();
        LocalDate applyEndDate = LocalDate.now().plusDays(10);

        List<ValidJobDto> mockDtos = List.of(
                ValidJobDto.builder()
                        .id(1L)
                        .companyName("Company A")
                        .title("Backend Engineer")
                        .jobValidType(1)
                        .isPublic(true)
                        .createdAt(createdAt)
                        .applyEndDate(applyEndDate)
                        .url("https://companyA.com/job1")
                        .build(),
                ValidJobDto.builder()
                        .id(2L)
                        .companyName("Company B")
                        .title("Data Scientist")
                        .jobValidType(1)
                        .isPublic(false)
                        .createdAt(createdAt.minusDays(1))
                        .applyEndDate(applyEndDate.minusDays(2))
                        .url("https://companyB.com/job2")
                        .build()
        );

        when(jobRepository.findAllWithValidType(pageable)).thenReturn(new PageImpl<>(mockDtos));

        // when
        List<ValidJobDto> result = jobService.findAllJobWithValidType(pageable);

        // then
        assertEquals(2, result.size());

        ValidJobDto first = result.get(0);
        assertEquals("Company A", first.getCompanyName());
        assertEquals("Backend Engineer", first.getTitle());
        assertEquals("https://companyA.com/job1", first.getUrl());
        assertTrue(first.getIsPublic());

        ValidJobDto second = result.get(1);
        assertEquals("Company B", second.getCompanyName());
        assertFalse(second.getIsPublic());
    }
}