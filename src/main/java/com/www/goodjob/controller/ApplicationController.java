package com.www.goodjob.controller;

import com.www.goodjob.dto.ApplicationCreateRequest;
import com.www.goodjob.dto.ApplicationResponse;
import com.www.goodjob.dto.ApplicationUpdateRequest;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/applications")
@Tag(name = "application-controller", description = "지원 이력 관련 API")
public class ApplicationController {
    private final ApplicationService applicationService;

    @Operation(
            summary = "지원 이력 추가",
            description = """
                    ✍️ 사용자가 특정 공고에 지원했음을 기록합니다.
                    
                    ✅ 프론트 흐름:
                    - 채용 공고 상세 화면에서 "관리 시작" 버튼 클릭 시 호출됩니다.
                    - 이후 '지원 관리 페이지'로 이동합니다.
                    
                    ✅ 요청 예시:
                    POST /applications?jobId=1769
                    
                    📌 applyStatus는 생략 가능하며 기본값은 "준비중"입니다.
                    """,
            responses = {
                    @ApiResponse(responseCode = "201", description = "이력 생성 성공"),
                    @ApiResponse(responseCode = "400", description = "존재하지 않는 공고 ID"),
                    @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)")
            }
    )
    @PostMapping("/apply")
    public ResponseEntity<Void> add(@AuthenticationPrincipal CustomUserDetails user,
                                    @RequestParam Long jobId) {
        applicationService.addApplication(user.getUser(), jobId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }


    @Operation(
            summary = "지원 이력 목록 조회",
            description = """
                    📋 현재 로그인한 사용자의 모든 지원 이력을 조회합니다.
                    
                    ✅ 프론트 흐름:
                    - 지원 관리 페이지 진입 시 호출됩니다.
                    - 각 이력은 공고명, 회사명, 마감일, 지원 상태 등을 포함합니다.
                    
                    ✅ 응답 예시:
                    [
                      {
                        "applicationId": 1,
                        "jobId": 1769,
                        "jobTitle": "프론트엔드 개발자 채용",
                        "companyName": "토스",
                        "applyEndDate": "2024-12-31",
                        "applyStatus": "지원",
                        "note": "1차 면접 완료",
                        "createdAt": "2025-05-14T10:12:45"
                      }
                    ]
                    """
    )
    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> getAll(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(applicationService.getApplications(user.getUser()));
    }

    @Operation(
            summary = "지원 이력 수정",
            description = """
                    ✏️ 지원 상태 및 메모를 수정합니다.
                    
                    ✅ 프론트 흐름:
                    - 사용자 입력에 따라 지원 상태 드롭다운 또는 메모 입력 후 저장 시 호출됩니다.
                    
                    ✅ 요청 예시:
                    {
                      "applyStatus": "면접",
                      "note": "1차 면접 완료, 분위기 좋았음"
                    }
                    
                    📌 상태(applyStatus)와 메모(note)는 각각 선택적으로 수정 가능합니다.
                    """
    )
    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails user,
                                       @RequestBody ApplicationUpdateRequest dto) {
        applicationService.updateApplication(user.getUser(), id, dto);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "지원 이력 삭제",
            description = """
                    🗑️ 지원 이력을 삭제합니다.
                    
                    ✅ 프론트 흐름:
                    - 지원 관리 페이지에서 특정 공고의 이력 삭제 버튼 클릭 시 호출됩니다.
                    
                    ✅ 결과:
                    - 해당 사용자의 이력만 삭제 가능하며, 삭제 후 목록에서 제거됩니다.
                    """
    )
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails user) {
        applicationService.deleteApplication(user.getUser(), id);
        return ResponseEntity.noContent().build();
    }
}
