package com.www.goodjob.controller;

import com.www.goodjob.dto.ApplicationCreateRequest;
import com.www.goodjob.dto.ApplicationResponse;
import com.www.goodjob.dto.ApplicationUpdateRequest;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
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

    @Operation(summary = "지원 이력 추가")
    @PostMapping
    public ResponseEntity<Void> add(@AuthenticationPrincipal CustomUserDetails user,
                                    @RequestBody ApplicationCreateRequest dto) {
        applicationService.addApplication(user.getUser(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "지원 이력 목록 조회")
    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> getAll(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(applicationService.getApplications(user.getUser()));
    }

    @Operation(summary = "지원 이력 수정")
    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails user,
                                       @RequestBody ApplicationUpdateRequest dto) {
        applicationService.updateApplication(user.getUser(), id, dto);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "지원 이력 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails user) {
        applicationService.deleteApplication(user.getUser(), id);
        return ResponseEntity.noContent().build();
    }
}