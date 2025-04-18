package com.www.goodjob.service;

import com.www.goodjob.domain.CvFeedback;
import com.www.goodjob.domain.RecommendScore;
import com.www.goodjob.domain.User;
import com.www.goodjob.repository.RecommendScoreRepository;
import com.www.goodjob.repository.CvFeedbackRepository;
import com.www.goodjob.security.CustomUserDetails;
import com.www.goodjob.util.ClaudeClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RecommendService {

    private final RestTemplate restTemplate;
    private final RecommendScoreRepository recommendScoreRepository;
    private final CvFeedbackRepository cvFeedbackRepository;
    private final ClaudeClient claudeClient;

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    /**
     * FastAPI 서버로 추천 점수 요청
     */
    public String requestRecommendation(Long userId, int topk) {
        String url = fastapiHost + "/recommend-jobs";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "u_id", userId,
                "top_k", topk
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            return "추천 요청 중 오류 발생: " + e.getMessage();
        }
    }

    /**
     * 추천 점수 기반 피드백 생성 또는 기존 피드백 조회
     */
    public String getOrGenerateFeedback(Long recommendScoreId, CustomUserDetails userDetails) {
        User user = userDetails.getUser();

        // 1. 추천 점수 조회
        RecommendScore score = recommendScoreRepository.findById(recommendScoreId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "추천 점수가 존재하지 않습니다"));

        // 2. 유저 검증
        if (!score.getCv().getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다");
        }

        // 3. 기존 피드백 조회
        Optional<CvFeedback> existing = cvFeedbackRepository.findByRecommendScore_Id(recommendScoreId);
        if (existing.isPresent()) {
            return existing.get().getFeedback();
        }

        // 4. Claude 호출 → 피드백 생성
        String feedback = claudeClient.generateFeedback(
                score.getCv().getRawText(),
                score.getJob().getRawJobsText()
        );

        // 5. 저장
        CvFeedback newFeedback = CvFeedback.builder()
                .recommendScore(score)
                .feedback(feedback)
                .confirmed(false)
                .build();

        cvFeedbackRepository.save(newFeedback);
        return feedback;
    }
}
