package com.www.goodjob.controller;

import com.www.goodjob.dto.DashboardDto;
import com.www.goodjob.dto.ServerStatus;
import com.www.goodjob.service.DashboardService;
import com.www.goodjob.service.MonitoringService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    private final DashboardService dashboardService;

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
        - ctr: 이번 주 채용공고 클릭률 (Click Through Rate, %)
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
}
