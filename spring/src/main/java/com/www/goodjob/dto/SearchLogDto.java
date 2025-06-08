package com.www.goodjob.dto;

import com.www.goodjob.domain.SearchLog;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class SearchLogDto {

    private String keyword;
    private LocalDateTime createdAt;

    public SearchLogDto(String keyword, LocalDateTime createdAt) {
        this.keyword = keyword;
        this.createdAt = createdAt;
    }

    public static SearchLogDto from(SearchLog log) {
        return new SearchLogDto(log.getKeyword(), log.getCreatedAt());
    }

}
