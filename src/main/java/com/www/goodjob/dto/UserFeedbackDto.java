package com.www.goodjob.dto;

import lombok.*;
import java.time.LocalDateTime;

public class UserFeedbackDto {

    @Getter @Setter
    public static class Create {
        private String content;
        private int satisfactionScore;
    }

    @Getter @Setter
    public static class Update {
        private String content;
        private int satisfactionScore;
    }

    @Getter @Setter
    @Builder
    public static class Response {
        private Long id;
        private Long userId;
        private String userName;
        private String content;
        private int satisfactionScore;
        private LocalDateTime createdAt;
    }
}