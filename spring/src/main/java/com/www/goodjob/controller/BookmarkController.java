package com.www.goodjob.controller;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.BookmarkService;
import com.www.goodjob.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/bookmark")
public class BookmarkController {

    private final UserRepository userRepository;
    private final BookmarkService bookmarkService;


    @PostMapping("/add")
    @Operation(
            summary = "북마크 추가",
            description = "현재 로그인한 사용자가 특정 채용공고(JobId)를 북마크에 추가합니다."
    )
    public ResponseEntity<String> addBookmark(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Long JobId
    ) {
        Long userId = userDetails.getId();

        boolean saved = bookmarkService.addBookmark(userId, JobId);
        if (saved) {
            return ResponseEntity.ok("add new bookmark.");
        } else {
            return ResponseEntity.badRequest().body("fail to add new bookmark.");
        }
    }

    @DeleteMapping("/remove")
    @Operation(
            summary = "북마크 삭제",
            description = "현재 로그인한 사용자가 특정 채용공고(JobId)를 북마크에서 제거합니다."
    )
    public ResponseEntity<String> removeBookmark(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Long JobId
    ) {
        Long userId = userDetails.getId();

        boolean removed = bookmarkService.removeBookmark(userId, JobId);
        if (removed) {
            return ResponseEntity.ok("bookmark removed.");
        } else {
            return ResponseEntity.badRequest().body("fail to remove bookmark.");
        }
    }

    @GetMapping("/me")
    @Operation(
            summary = "내 북마크 목록 조회",
            description = "현재 로그인한 사용자의 모든 북마크된 채용공고 리스트를 반환합니다."
    )
    public ResponseEntity<List<ScoredJobDto>> getMyBookmarks(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ScoredJobDto> bookmarkedJobs = bookmarkService.getBookmarkedJobsByUser(user);

        return ResponseEntity.ok(bookmarkedJobs);
    }

}
