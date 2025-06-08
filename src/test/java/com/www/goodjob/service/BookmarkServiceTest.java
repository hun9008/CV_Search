//package com.www.goodjob.service;
//
//import com.www.goodjob.domain.*;
//import com.www.goodjob.dto.ScoredJobDto;
//import com.www.goodjob.repository.*;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//
//import java.util.ArrayList;
//import java.util.List;
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.eq;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//class BookmarkServiceTest {
//
//    @InjectMocks
//    private BookmarkService bookmarkService;
//
//    @Mock
//    private BookmarkRepository bookmarkRepository;
//
//    @Mock
//    private UserRepository userRepository;
//
//    @Mock
//    private JobRepository jobRepository;
//
//    @Mock
//    private RecommendScoreRepository recommendScoreRepository;
//
//    @Mock
//    private CvRepository cvRepository;
//
//    @Test
//    void addBookmark_returnsFalse_ifAlreadyExists() {
//        // given
//        Long userId = 1L;
//        Long jobId = 100L;
//
//        when(bookmarkRepository.existsByUserIdAndJobId(userId, jobId)).thenReturn(true);
//
//        // when
//        boolean result = bookmarkService.addBookmark(userId, jobId);
//
//        // then
//        assertFalse(result);
//        verify(bookmarkRepository, never()).save(any());
//    }
//
//    @Test
//    void addBookmark_savesBookmark_ifNotExists() {
//        // given
//        Long userId = 1L;
//        Long jobId = 100L;
//
//        User user = new User();
//        user.setId(userId);
//
//        Job job = new Job();
//        job.setId(jobId);
//        job.setFavicon(new Favicon(null, "some-domain", "base64string"));
//
//        when(bookmarkRepository.existsByUserIdAndJobId(userId, jobId)).thenReturn(false);
//        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
//        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
//
//        // when
//        boolean result = bookmarkService.addBookmark(userId, jobId);
//
//        // then
//        assertTrue(result);
//        verify(bookmarkRepository).save(any(Bookmark.class));
//    }
//
//    @Test
//    void addBookmark_throwsException_ifUserNotFound() {
//        Long userId = 1L;
//        Long jobId = 100L;
//
//        when(bookmarkRepository.existsByUserIdAndJobId(userId, jobId)).thenReturn(false);
//        when(userRepository.findById(userId)).thenReturn(Optional.empty());
//
//        assertThrows(RuntimeException.class, () -> bookmarkService.addBookmark(userId, jobId));
//    }
//
//    @Test
//    void addBookmark_throwsException_ifJobNotFound() {
//        Long userId = 1L;
//        Long jobId = 100L;
//
//        User user = new User();
//        user.setId(userId);
//
//        when(bookmarkRepository.existsByUserIdAndJobId(userId, jobId)).thenReturn(false);
//        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
//        when(jobRepository.findById(jobId)).thenReturn(Optional.empty());
//
//        assertThrows(RuntimeException.class, () -> bookmarkService.addBookmark(userId, jobId));
//    }
//
//
//    @Test
//    void removeBookmark_returnsFalse_ifBookmarkDoesNotExist() {
//        // given
//        Long userId = 1L;
//        Long jobId = 100L;
//
//        when(bookmarkRepository.findByUserIdAndJobId(userId, jobId)).thenReturn(Optional.empty());
//
//        // when
//        boolean result = bookmarkService.removeBookmark(userId, jobId);
//
//        // then
//        assertFalse(result);
//        verify(bookmarkRepository, never()).delete(any());
//    }
//
//    @Test
//    void removeBookmark_deletesBookmark_ifExists() {
//        // given
//        Long userId = 1L;
//        Long jobId = 100L;
//
//        Bookmark bookmark = new Bookmark();
//        bookmark.setId(10L); // optional
//        when(bookmarkRepository.findByUserIdAndJobId(userId, jobId)).thenReturn(Optional.of(bookmark));
//
//        // when
//        boolean result = bookmarkService.removeBookmark(userId, jobId);
//
//        // then
//        assertTrue(result);
//        verify(bookmarkRepository).delete(bookmark);
//    }
//
//
//    @Test
//    void getBookmarkedJobsByUser_returnsScoredJobDtos() {
//        // given
//        User mockUser = new User();
//        mockUser.setId(1L);
//
//        Job job1 = new Job();
//        job1.setId(100L);
//        job1.setTitle("백엔드 개발자");
//        job1.setFavicon(new Favicon(null, "some-domain", "base64string"));
//
//        Job job2 = new Job();
//        job2.setId(200L);
//        job2.setTitle("프론트엔드 개발자");
//        job2.setFavicon(new Favicon(null, "some-domain", "base64string"));
//
//        Bookmark b1 = new Bookmark();
//        b1.setUser(mockUser);
//        b1.setJob(job1);
//
//        Bookmark b2 = new Bookmark();
//        b2.setUser(mockUser);
//        b2.setJob(job2);
//
//        when(bookmarkRepository.findAllByUser(mockUser)).thenReturn(List.of(b1, b2));
//
//        Cv cv = new Cv();
//        cv.setId(500L);
//        cv.setUser(mockUser);
//
//        List<Cv> cvs = new ArrayList<Cv>();
//        cvs.add(cv);
//
//        when(cvRepository.findAllByUser(mockUser)).thenReturn(cvs);
//
//        RecommendScore rs1 = new RecommendScore();
//        rs1.setCv(cv);
//        rs1.setJob(job1);
//        rs1.setScore(0.85f);
//
//        when(recommendScoreRepository.findByCvIdAndJobIdIn(eq(500L), eq(List.of(100L, 200L))))
//                .thenReturn(List.of(rs1));
//
//        // when
//        List<ScoredJobDto> result = bookmarkService.getBookmarkedJobsByUser(mockUser);
//
//        // then
//        assertEquals(2, result.size());
//
//        ScoredJobDto job1Dto = result.stream()
//                .filter(dto -> dto.getId().equals(100L))
//                .findFirst()
//                .orElseThrow();
//
//        assertEquals(0.85f, job1Dto.getScore());
//
//        ScoredJobDto job2Dto = result.stream()
//                .filter(dto -> dto.getId().equals(200L))
//                .findFirst()
//                .orElseThrow();
//
//        assertEquals(0.0f, job2Dto.getScore());  // 점수 없음 → default 0
//        verify(bookmarkRepository).findAllByUser(mockUser);
//        verify(cvRepository).findAllByUser(mockUser);
//        verify(recommendScoreRepository).findByCvIdAndJobIdIn(500L, List.of(100L, 200L));
//    }
//}