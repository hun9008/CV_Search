package com.www.goodjob.service;

import com.www.goodjob.domain.*;
import com.www.goodjob.repository.*;
import com.www.goodjob.util.ClaudeClient;
import com.www.goodjob.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.www.goodjob.security.CustomUserDetails;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CvFeedbackService {

    private final CvRepository cvRepository;
    private final JobRepository jobRepository;
    private final CvFeedbackRepository cvFeedbackRepository;
    private final RecommendScoreRepository recommendScoreRepository;
    private final ClaudeClient claudeClient;

    public String getOrGenerateFeedback(Long cvId, Long jobId, CustomUserDetails userDetails) {
        // 1. 로그인 사용자 정보
        User user = userDetails.getUser();

        // 2. CV 조회 + 소유자 확인
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CV를 찾을 수 없습니다"));

        if (!cv.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 CV에 접근 권한이 없습니다");
        }

        // 3. Job 조회
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채용 공고를 찾을 수 없습니다"));

        // 4. 추천 점수 조회
        RecommendScore score = recommendScoreRepository.findByCvAndJob(cv, job)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "추천 점수가 존재하지 않습니다"));

        // 5. 기존 피드백 있으면 반환
        Optional<CvFeedback> existing = cvFeedbackRepository.findByRecommendScore_Id(score.getId());
        if (existing.isPresent()) {
            return existing.get().getFeedback();
        }

        // 6. Claude 호출 → 피드백 생성
        String feedback = claudeClient.generateFeedback(cv.getRawText(), job.getRawJobsText());

        // 7. DB 저장
        CvFeedback newFeedback = CvFeedback.builder()
                .recommendScore(score)
                .feedback(feedback)
                .confirmed(false)
                .build();

        cvFeedbackRepository.save(newFeedback);
        return feedback;
    }

}
