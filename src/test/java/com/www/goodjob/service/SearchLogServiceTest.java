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
        SearchLog log1 = SearchLog.of("백엔드", testUser);
        SearchLog log2 = SearchLog.of("토스", testUser);

        when(searchLogRepository.findTop10ByUserOrderByCreatedAtDesc(testUser))
                .thenReturn(List.of(log1, log2));

        // when
        List<SearchLogDto> result = searchLogService.getSearchHistory(testUser);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getKeyword()).isEqualTo("백엔드");
        verify(searchLogRepository, times(1)).findTop10ByUserOrderByCreatedAtDesc(testUser);
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
