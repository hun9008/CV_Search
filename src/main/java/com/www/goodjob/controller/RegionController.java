package com.www.goodjob.controller;

import com.www.goodjob.domain.Region;
import com.www.goodjob.repository.RegionRepository;
import com.www.goodjob.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/region")
public class RegionController {

    private final RegionService regionService;
    private final RegionRepository regionRepository;

    @PostMapping("/load")
    public ResponseEntity<String> loadRegions(@RequestParam(required = false) String cd) {
        regionService.fetchAndSaveRegions(cd);
        return ResponseEntity.ok("지역 저장 완료");
    }

    @PostMapping("/load/all")
    public ResponseEntity<String> loadAllRegions() {
        regionService.fetchAllRegions();
        return ResponseEntity.ok("전국 전체 지역 저장 완료");
    }

    @GetMapping
    public ResponseEntity<List<Region>> getAllRegions() {
        return ResponseEntity.ok(regionRepository.findAll());
    }
}
