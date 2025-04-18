package com.www.goodjob.service;

import com.www.goodjob.domain.*;
import com.www.goodjob.repository.*;
import com.www.goodjob.util.ClaudeClient;
import com.www.goodjob.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CvFeedbackService {

    private final CvRepository cvRepository;
    private final JobRepository jobRepository;
    private final CvFeedbackRepository cvFeedbackRepository;
    private final UserRepository userRepository;
    private final ClaudeClient claudeClient;
    private final JwtUtils jwtUtils;

    public String getOrGenerateFeedback(Long cvId, Long jobId, String authHeader) {
        // 1. 토큰에서 email 추출 → user 조회
        String email = jwtUtils.extractEmailFromHeader(authHeader);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다"));

        // 2. CV 조회 + 소유자 확인
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CV를 찾을 수 없습니다"));

        if (!cv.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 CV에 접근 권한이 없습니다");
        }

        // 3. Job 조회
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채용 공고를 찾을 수 없습니다"));

        // 4. 기존 피드백 있으면 반환
        Optional<CvFeedback> existing = cvFeedbackRepository.findByCvAndJob(cv, job);
        if (existing.isPresent()) {
            return existing.get().getFeedback();
        }

        // 5. Claude 호출 → 피드백 생성
        String feedback = claudeClient.generateFeedback(cv.getRawText(), job.getRawJobsText());

        // 6. DB 저장
        CvFeedback newFeedback = CvFeedback.builder()
                .feedback(feedback)
                .confirmed(false)
                .build();

        cvFeedbackRepository.save(newFeedback);

        return feedback;
    }
}
