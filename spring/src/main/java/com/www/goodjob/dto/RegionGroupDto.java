package com.www.goodjob.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionGroupDto {
    private String sido;
    private List<String> sigunguList;
}
