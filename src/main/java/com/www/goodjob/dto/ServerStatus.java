package com.www.goodjob.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServerStatus {
    private String name;         // 예: "Redis Cache"
    private boolean isUp;        // 예: true
    private double uptime;       // 예: 99.95
    private double responseTime;    // 예: 5 (ms)
}
