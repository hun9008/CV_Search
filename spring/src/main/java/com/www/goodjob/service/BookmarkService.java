package com.www.goodjob.service;

import com.www.goodjob.domain.*;
import com.www.goodjob.dto.JobDto;
import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
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
        List<Bookmark> bookmarks = bookmarkRepository.findAllByUser(user);
        List<Job> jobs = bookmarks.stream().map(Bookmark::getJob).toList();
        List<Long> jobIds = jobs.stream().map(Job::getId).toList();

        List<Cv> cvs = cvRepository.findAllByUser(user);
        if (cvs.isEmpty()) {
            throw new RuntimeException("CV not found for user");
        }

        List<RecommendScore> allScores = new ArrayList<>();
        for (Cv cv : cvs) {
            allScores.addAll(
                    recommendScoreRepository.findByCvIdAndJobIdIn(cv.getId(), jobIds)
            );
        }

        Map<Long, Float> scoreMap = new HashMap<>();
        for (RecommendScore rs : allScores) {
            Long jobId = rs.getJob().getId();
            float score = rs.getScore();
            scoreMap.put(jobId, Math.max(scoreMap.getOrDefault(jobId, 0f), score));
        }

        return jobs.stream()
                .map(JobDto::from)
                .map(dto -> ScoredJobDto.from(
                        dto,
                        scoreMap.getOrDefault(dto.getId(), 0f),
                        0.0,  // cosine, bm25 점수 없음
                        0.0
                ))
                .collect(Collectors.toList());
    }
}
