package com.www.goodjob.controller;

import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.UserDto;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.service.BookmarkService;
import com.www.goodjob.service.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/bookmark")
public class BookmarkController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final BookmarkService bookmarkService;

    @PostMapping("/add")
    public ResponseEntity<String> addBookmark(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam Long JobId
    ) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtTokenProvider.getEmail(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long userId = user.getId();

        boolean saved = bookmarkService.addBookmark(userId, JobId);
        if (saved) {
            return ResponseEntity.ok("add new bookmark.");
        } else {
            return ResponseEntity.badRequest().body("fail to add new bookmark.");
        }
    }

    @DeleteMapping("/remove")
    public ResponseEntity<String> removeBookmark(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam Long JobId
    ) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtTokenProvider.getEmail(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long userId = user.getId();
        boolean removed = bookmarkService.removeBookmark(userId, JobId);
        if (removed) {
            return ResponseEntity.ok("bookmark removed.");
        } else {
            return ResponseEntity.badRequest().body("fail to remove bookmark.");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<List<Job>> getMyBookmarks(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtTokenProvider.getEmail(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Job> bookmarkedJobs = bookmarkService.getBookmarkedJobsByUser(user);
        return ResponseEntity.ok(bookmarkedJobs);
    }

}
