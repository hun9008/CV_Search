package com.www.goodjob.dto;

import lombok.Data;
import java.util.List;

@Data
public class JobSearchResponse {
    private int total;
    private List<JobSearchDto> results;
}
