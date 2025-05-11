package com.www.goodjob.service;

import com.www.goodjob.domain.*;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final RecommendScoreRepository recommendScoreRepository;
    private final CvRepository cvRepository;

    @Transactional
    public boolean addBookmark(Long userId, Long jobId) {

        boolean exists = bookmarkRepository.existsByUserIdAndJobId(userId, jobId);
        if (exists) {
            return false;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        Bookmark bookmark = Bookmark.builder()
                .user(user)
                .job(job)
                .build();

        bookmarkRepository.save(bookmark);
        return true;
    }

    @Transactional
    public boolean removeBookmark(Long userId, Long jobId) {
        Bookmark bookmark = bookmarkRepository.findByUserIdAndJobId(userId, jobId)
                .orElse(null);
        if (bookmark == null) {
            return false;
        }

        bookmarkRepository.delete(bookmark);
        return true;
    }

    @Transactional(readOnly = true)
    public List<ScoredJobDto> getBookmarkedJobsByUser(User user) {
        Long userId = user.getId();

        // 1. 북마크된 Job 목록
        List<Bookmark> bookmarks = bookmarkRepository.findAllByUser(user);
        List<Job> jobs = bookmarks.stream().map(Bookmark::getJob).toList();
        List<Long> jobIds = jobs.stream().map(Job::getId).toList();

        Cv cv = cvRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("CV not found"));
        Long cvId = cv.getId();
        List<RecommendScore> scores = recommendScoreRepository.findByCvIdAndJobIdIn(cvId, jobIds);
        Map<Long, Float> scoreMap = scores.stream()
                .collect(Collectors.toMap(rs -> rs.getJob().getId(), RecommendScore::getScore));

        // 3. ScoredJobDto로 변환
        return jobs.stream()
                .map(JobDto::from)
                .map(dto -> ScoredJobDto.from(
                        dto,
                        scoreMap.getOrDefault(dto.getId(), 0f),
                        0.0,  // cosine, bm25 점수는 없으므로 기본값
                        0.0
                ))
                .collect(Collectors.toList());
    }
}
