package com.www.goodjob.dto;

import com.www.goodjob.domain.User;
import com.www.goodjob.enums.TossPaymentPlan;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserDto {
    private Long id;
    private String email;
    private String name;
    private String role;
    private LocalDateTime createdAt;
    private TossPaymentPlan plan;

    public static UserDto from(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .createdAt(user.getCreatedAt())
                .plan(user.getPlan())
                .build();
    }
}
