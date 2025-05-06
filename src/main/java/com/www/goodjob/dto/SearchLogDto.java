package com.www.goodjob.dto;

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

    public String getKeyword() {
        return keyword;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // 필요하면 Setter도 추가 가능
}
