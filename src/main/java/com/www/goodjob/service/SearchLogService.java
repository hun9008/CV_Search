package com.www.goodjob.service;

import com.www.goodjob.domain.SearchLog;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.SearchLogDto;
import com.www.goodjob.repository.SearchLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchLogService {

    private final SearchLogRepository searchLogRepository;

    public void saveSearchLog(String keyword, User user) {
        // 가장 최근 검색 기록 가져오기
        SearchLog latest = searchLogRepository.findTop1ByUserOrderByCreatedAtDesc(user);

        // 최근 검색어와 현재 검색어가 같으면 저장하지 않음
        if (latest != null && latest.getKeyword().equalsIgnoreCase(keyword.trim())) {
            return;
        }

        // 저장
        SearchLog log = SearchLog.of(keyword.trim(), user);
        searchLogRepository.save(log);
    }

    public List<SearchLogDto> getSearchHistory(User user) {
        return searchLogRepository.findTop10ByUserOrderByCreatedAtDesc(user).stream()
                .map(log -> new SearchLogDto(log.getKeyword(), log.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void deleteAllHistory(User user) {
        searchLogRepository.deleteAllByUser(user);
    }

    @Transactional
    public void deleteKeyword(User user, String keyword) {
        searchLogRepository.deleteByUserAndKeyword(user, keyword.trim());
    }
}

