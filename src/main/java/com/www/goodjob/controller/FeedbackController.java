package com.www.goodjob.controller;

import com.www.goodjob.service.CvFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/feedback")
public class FeedbackController {

    private final CvFeedbackService feedbackService;

    @GetMapping
    public String generateFeedback(@RequestParam Long cvId, @RequestParam Long jobId,
                                   @RequestHeader("Authorization") String authHeader) {
        return feedbackService.getOrGenerateFeedback(cvId, jobId, authHeader);
    }

}
