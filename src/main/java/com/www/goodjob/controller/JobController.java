package com.www.goodjob.controller;

import com.www.goodjob.dto.JobSearchResponse;
import com.www.goodjob.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "job-controller", description = "채용 공고 관련 API (채용 공고는 🔐 Authorization: Bearer <accessToken> 필요없음, 비회원도 가능하기 때문)")
@RestController
@RequiredArgsConstructor
@RequestMapping("/jobs")
public class JobController {

    private final JobService jobService;

    @Operation(
            summary = "채용 공고 검색",
            description = """
키워드, 고용 형태, 요구 경력 조건으로 채용 공고 검색 가능함
정렬 및 페이징 옵션도 함께 사용 가능함

🧭 사용 방식
- 키워드만 넣어서 검색 가능함 (예: keyword=토스)
- 키워드 없이 필터(jobType, experience)만 넣는 것도 가능함
- 키워드 + 필터 동시 조합도 지원함

🔍 키워드는 아래 항목에 대해 부분 일치 검색됨:
- 회사 이름 (company_name)
- 공고 제목 (title)
- 부서명 (department)
- 요구 경력 (require_experience)
- 직무 기술서 (job_description)
- 근무 유형 (job_type)
- 우대 조건 (preferred_qualifications)
- 인재상 (ideal_candidate)
- 필수 요구 조건 (requirements)

📌 페이징 관련 설명:
- page는 0부터 시작함 (예: 첫 페이지 → page=0)
- size는 한 페이지당 보여줄 공고 수 설정함 (예: size=10이면 한 페이지에 10개씩 나옴)
- 기본 정렬은 createdAt(공고 등록일순) 기준 내림차순 (최신순)

예시 요청:
- GET /jobs/search?keyword=토스&jobType=정규직&experience=신입&experience=경력&page=1&size=10&sort=createdAt,DESC
- axios.get('/jobs/search', {
  params: {
    keyword: '토스',
    jobType: ['정규직'],
    experience: ['신입', '경력'],
    page: 1,
    size: 10,
    sort: 'createdAt,DESC'
  }
})

"""
    )
    @GetMapping("/search")
    public ResponseEntity<Page<JobSearchResponse>> searchJobs(
            @Parameter(description = "키워드 검색. 회사명, 공고 제목, 부서, 직무 설명, 조건 등에서 부분 일치로 검색됨")
            @RequestParam(required = false) String keyword,

            @Parameter(description = "근무 유형 필터. < 정규직, 계약직, 인턴, 아르바이트, 프리랜서, 파견직 > 중 선택 (다중 선택 가능)")
            @RequestParam(required = false) List<String> jobType,

            @Parameter(description = "요구 경력 필터. < 신입, 경력, 경력무관 > 중 선택 (다중 선택 가능)")
            @RequestParam(required = false) List<String> experience,

            @ParameterObject
            @PageableDefault(
                    page = 0,
                    size = 10,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        Page<JobSearchResponse> result = jobService.searchJobs(keyword, jobType, experience, pageable);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "근무 유형 목록 조회", description = "근무 유형 필터 옵션 반환함. < 정규직, 계약직, 인턴, 아르바이트, 프리랜서, 파견직 > 프론트 필터 select용" +
            " / 화면에서 '근무 유형' 필터 눌렀을 때 표시되는 리스트들")
    @GetMapping("/job-types")
    public ResponseEntity<List<String>> getJobTypes() {
        return ResponseEntity.ok(jobService.getAvailableJobTypes());
    }

    @Operation(summary = "요구 경력 목록 조회", description = "요구 경력 필터 옵션 반환함. < 신입, 경력, 경력무관 > 프론트 필터 select용" +
            " / 화면에서 '요구 경력' 필터 눌렀을 때 표시되는 리스트들")
    @GetMapping("/experience-types")
    public ResponseEntity<List<String>> getExperienceTypes() {
        return ResponseEntity.ok(jobService.getAvailableExperienceTypes());
    }


    @Operation(summary = "특정 job 하나 삭제", description = "FastAPI 서버로 특정 job 하나 삭제 요청을 보냄." +
            "해당 job에 대해 ES에서 vector 삭제 & RDB의 is_public을 0으로 설정" +
            "실패 시, is_public은 다시 1로 롤백하는 로직 포함.")
    @DeleteMapping("/delete-one-job")
    public ResponseEntity<?> deleteJob(@RequestParam("jobId") Long jobId) {
        try {
            String message = jobService.deleteJob(jobId);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
