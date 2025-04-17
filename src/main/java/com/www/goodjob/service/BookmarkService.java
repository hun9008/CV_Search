package com.www.goodjob.service;

import com.www.goodjob.domain.Bookmark;
import com.www.goodjob.domain.Job;
import com.www.goodjob.domain.User;
import com.www.goodjob.repository.BookmarkRepository;
import com.www.goodjob.repository.JobRepository;
import com.www.goodjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

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
    public List<Job> getBookmarkedJobsByUser(User user) {
        return bookmarkRepository.findAllByUser(user).stream()
                .map(Bookmark::getJob)
                .collect(Collectors.toList());
    }
}
