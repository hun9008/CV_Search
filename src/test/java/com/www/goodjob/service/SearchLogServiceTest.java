package com.www.goodjob.service;

import com.www.goodjob.domain.User;
import com.www.goodjob.domain.SearchLog;
import com.www.goodjob.dto.SearchLogDto;
import com.www.goodjob.repository.SearchLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

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
        Object[] row1 = new Object[]{"백엔드", java.sql.Timestamp.valueOf("2024-06-01 10:00:00")};
        Object[] row2 = new Object[]{"토스", java.sql.Timestamp.valueOf("2024-06-01 09:00:00")};

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
}
