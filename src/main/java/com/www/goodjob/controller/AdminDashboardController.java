package com.www.goodjob.controller;

import com.www.goodjob.domain.Job;
import com.www.goodjob.dto.CreateJobDto;
import com.www.goodjob.dto.DashboardDto;
import com.www.goodjob.dto.ServerStatus;
import com.www.goodjob.dto.ValidJobDto;
import com.www.goodjob.service.DashboardService;
import com.www.goodjob.service.JobService;
import com.www.goodjob.service.MonitoringService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    private final DashboardService dashboardService;
    private final JobService jobService;
    private final MonitoringService monitoringService;

    @Operation(
            summary = "대시보드 통계 조회",
            description = """
        대시보드에 표시될 전체 통계 데이터를 반환합니다.
        
        반환되는 항목:
        - totalUsers: 전체 유저 수
        - weeklyUserChange: 전주 대비 이번 주 신규 유저 수 변화량
        - totalJobs: 전체 채용공고 수
        - weeklyJobChange: 전주 대비 이번 주 신규 채용공고 수 변화량
        - averageSatisfaction: 현재까지 유저 만족도 평균 (5점 척도)
        - weeklySatisfactionChange: 전주 대비 만족도 변화량
        - activeUsersThisWeek: 이번 주 한 번 이상 활동한 유저 수
        - activeUserDiff: 전주 대비 활동 유저 수 변화량
        - ctr: 이번 주 채용공고 전체 클릭률 (Click Through Rate, %)
        - dailyCtrList: 최근 7일간 일별 클릭률 목록 (과거 → 현재 순서, 단위: %)
        - topKeywords: 인기 검색 키워드 Top 10 목록
        """
    )
    @GetMapping
    public DashboardDto getDashboardStats() {
        return dashboardService.getDashboardStats();
    }

    @Operation(summary = "서버 상태 확인", description = "Prometheus를 통해 Redis, Spring, FastAPI 서버의 상태와 응답 시간을 조회합니다. " +
            "responseTime은 ms단위")
    @GetMapping("/server-status")
    public ResponseEntity<List<ServerStatus>> getServerStatus() {
        ServerStatus redisStatus = monitoringService.getRedisStatus();
        ServerStatus springStatus = monitoringService.getSpringStatus();
        ServerStatus fastAPIStatus = monitoringService.getFastapiStatus();
        return ResponseEntity.ok(List.of(redisStatus, springStatus, fastAPIStatus));
    }

    @Operation(summary = "특정 job 하나 삭제",
            description =
                    """
                     FastAPI 서버로 특정 job 하나 삭제 요청을 보냄.
                     해당 job에 대해 ES에서 vector 삭제 & RDB의 is_public을 0으로 설정\n
                     validType :\n 
                     0: 확인안함
                     1: 정상 \n
                     2: 마감 (페이지 표시되지않음, 기간만료됨 포함)\n
                     3: 잘못된내용(채용공고가 확실히 아님) \n
                     실패 시, is_public은 다시 1로 롤백하는 로직 포함.
                     삭제시 삭제이유 valid type을 업데이트 함
                    """)
    @DeleteMapping("/delete-one-job-valid-type")
    public ResponseEntity<?> deleteJobWithValidType(
            @RequestParam("jobId") Long jobId,
            @RequestParam("validType") Integer validType
    ) {
        try {
            String message = jobService.deleteJobWithValidType(jobId ,validType);

            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    @Operation(summary = "job +valid Type 함께 가져오는 함수" ,description=  """
            응답 방식
             기존의 공고 정보와 validType이 전달됨   
             validType :\n 
             0: 확인안함
             1: 정상 \n
             2: 마감 (페이지 표시되지않음, 기간만료됨 포함)\n
             3: 잘못된내용(채용공고가 확실히 아님) \n
             실패 시, is_public은 다시 1로 롤백하는 로직 포함.
             삭제시 삭제이유 valid type을 업데이트 함
                
            예시 응답:
            [
              {
                "id": 4,
                "companyName": "SK\\t바이오텍",
                "title": "공고(상세페이지) < Jobs < SK Careers",
                "jobValidType": 1,
                "isPublic": false,
                "createdAt": "2025-04-21T15:30:46",
                "applyEndDate": "2025-03-17",
                "url": "https://www.skcareers.com/Recruit/Detail/R250305"
              },
              {
                "id": 5,
                "companyName": "SK바이오텍",
                "title": "공고(상세페이지) < Jobs < SK Careers",
                "jobValidType": 1,
                "isPublic": false,
                "createdAt": "2025-04-21T15:30:57",
                "applyEndDate": "2025-03-24",
                "url": "https://www.skcareers.com/Recruit/Detail/R250442"
              },
            ]
            """)
    @GetMapping("/job-valid-type" )
    public ResponseEntity<?> getJobWithValidType(){
        try{
            List<ValidJobDto> JobList =jobService.findAllJobWithValidType();
            return ResponseEntity.ok(JobList);
        }
        catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    @Operation(summary = "채용 공고 생성 또는 수정",
            description = """
        채용 공고 정보를 생성하거나, 같은 ID의 공고가 있으면 덮어씁니다.

        - 입력으로는 채용 공고 정보와 해당 공고가 속한 지역 ID 리스트를 포함한 `CreateJobDto`를 전달해야 합니다.
        - 내부적으로 job 정보를 저장하고, 연관된 지역 정보(`region_id`)를 `job_region` 테이블에 함께 저장합니다.
        - jobRegions에 있는 각 지역 ID에 대해 해당 지역이 없으면 예외를 발생시킵니다.
        - 성공 시 저장된 `Job` 객체를 반환합니다.

        실패 시:
        - 내부 로직 중 예외 발생 시 HTTP 500 응답을 반환합니다.
        - 예외 메시지는 JSON 형식으로 `"error"` 필드에 담아 응답합니다.

        예시 요청:
        {
            "title": "백엔드 개발자 채용",
            "companyName": "GoodJob Inc.",
            "url": "https://goodjob.com/job/123",
            "jobRegions": [1, 2, 3]
        }

        예시 응답:
        {
            "id": 123,
            "title": "백엔드 개발자 채용",
            "companyName": "GoodJob Inc.",
            "url": "https://goodjob.com/job/123",
            ...
        }
        """
    )
    @PostMapping("/job")
    public ResponseEntity<?> createOrUpdate(@RequestBody CreateJobDto dto) {
        Job job;
        try {
            job = jobService.createOrUpdateJob(dto);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
        return ResponseEntity.ok(job);
    }

}
