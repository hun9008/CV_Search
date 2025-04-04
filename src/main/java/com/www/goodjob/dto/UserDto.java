package com.www.goodjob.dto;

import com.www.goodjob.domain.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserDto {
    private Long id;
    private String email;
    private String name;
    private String region;
    private String role;
    private LocalDateTime createdAt;

    public static UserDto from(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .region(user.getRegion())
                .role(user.getRole() != null ? user.getRole().name() : "USER") // fallback
                .createdAt(user.getCreatedAt())
                .build();
    }

}
