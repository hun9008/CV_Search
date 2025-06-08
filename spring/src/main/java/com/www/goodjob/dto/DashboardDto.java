package com.www.goodjob.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDto {
    private long totalUserCount;
    private int weeklyUserChange;

    private long totalJobCount;
    private int weeklyJobChange;

    private float averageSatisfaction;
    private float weeklySatisfactionChange;

    private long activeUserCount;
    private int weeklyActiveUserChange;

    private float ctr;

    private List<Float> dailyCtrList;

    private List<KeywordCount> topKeywords;

}
