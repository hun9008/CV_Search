package com.www.goodjob.controller;

import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.service.CvFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/feedback")
public class FeedbackController {

    private final CvFeedbackService feedbackService;

    @GetMapping
    public String generateFeedback(@RequestParam Long cvId,
                                   @RequestParam Long jobId,
                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        return feedbackService.getOrGenerateFeedback(cvId, jobId, userDetails);
    }
}
