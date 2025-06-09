package com.www.goodjob.service;

import com.www.goodjob.domain.SearchLog;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.SearchLogDto;
import com.www.goodjob.repository.SearchLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Timestamp;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class SearchLogServiceTest {

    private SearchLogRepository searchLogRepository;
    private SearchLogService searchLogService;

    private User testUser;

    @BeforeEach
    void setUp() {
        searchLogRepository = mock(SearchLogRepository.class);
        searchLogService = new SearchLogService(searchLogRepository);

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
    }

    @Test
    void 검색기록_조회_테스트() {
        // given
        Object[] row1 = new Object[]{"백엔드", Timestamp.valueOf("2024-06-01 10:00:00")};
        Object[] row2 = new Object[]{"토스", Timestamp.valueOf("2024-06-01 09:00:00")};

        when(searchLogRepository.findDistinctRecentKeywordsByUser(eq(testUser.getId())))
                .thenReturn(List.of(row1, row2));

        // when
        List<SearchLogDto> result = searchLogService.getSearchHistory(testUser);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getKeyword()).isEqualTo("백엔드");
        verify(searchLogRepository, times(1)).findDistinctRecentKeywordsByUser(testUser.getId());
    }

    @Test
    void 검색기록_전체삭제_테스트() {
        // when
        searchLogService.deleteAllHistory(testUser);

        // then
        verify(searchLogRepository, times(1)).deleteAllByUser(testUser);
    }

    @Test
    void 검색기록_키워드삭제_테스트() {
        // when
        searchLogService.deleteKeyword(testUser, "토스");

        // then
        verify(searchLogRepository).deleteByUserAndKeyword(testUser, "토스");
    }

    @Test
    void saveSearchLog_같은_키워드는_저장하지_않음() {
        // given
        String keyword = "백엔드";
        SearchLog recentLog = SearchLog.of("백엔드", testUser);
        when(searchLogRepository.findTop1ByUserOrderByCreatedAtDesc(testUser)).thenReturn(recentLog);

        // when
        searchLogService.saveSearchLog(keyword, testUser);

        // then
        verify(searchLogRepository, never()).save(any(SearchLog.class));
    }

    @Test
    void saveSearchLog_다른_키워드는_저장됨() {
        // given
        String keyword = "프론트엔드";
        SearchLog recentLog = SearchLog.of("백엔드", testUser);
        when(searchLogRepository.findTop1ByUserOrderByCreatedAtDesc(testUser)).thenReturn(recentLog);

        // when
        searchLogService.saveSearchLog(keyword, testUser);

        // then
        verify(searchLogRepository).save(any(SearchLog.class));
    }

    @Test
    void saveSearchLog_이전기록이_없을때_저장됨() {
        // given
        String keyword = "인공지능";
        when(searchLogRepository.findTop1ByUserOrderByCreatedAtDesc(testUser)).thenReturn(null);

        // when
        searchLogService.saveSearchLog(keyword, testUser);

        // then
        verify(searchLogRepository).save(any(SearchLog.class));
    }
}
