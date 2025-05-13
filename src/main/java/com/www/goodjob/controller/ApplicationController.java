package com.www.goodjob.controller;

import com.www.goodjob.domain.Application;
import com.www.goodjob.dto.ApplicationDto;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.ApplicationService;
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

    @PostMapping
    public ResponseEntity<Void> add(@AuthenticationPrincipal CustomUserDetails user,
                                    @RequestBody ApplicationDto dto) {
        applicationService.addApplication(user.getUser(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping
    public ResponseEntity<List<Application>> getAll(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(applicationService.getApplications(user.getUser()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@AuthenticationPrincipal CustomUserDetails user,
                                       @PathVariable Long id,
                                       @RequestBody ApplicationDto dto) {
        applicationService.updateApplication(user.getUser(), id, dto);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal CustomUserDetails user,
                                       @PathVariable Long id) {
        applicationService.deleteApplication(user.getUser(), id);
        return ResponseEntity.noContent().build();
    }
}
