package com.www.goodjob.domain;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
public class SearchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String keyword;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    public static SearchLog of(String keyword, User user) {
        SearchLog log = new SearchLog();
        log.keyword = keyword;
        log.user = user;
        log.createdAt = LocalDateTime.now();
        return log;
    }
}
