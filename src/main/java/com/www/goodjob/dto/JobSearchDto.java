package com.www.goodjob.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class JobSearchDto {

    @JsonProperty("job_id")
    private Long jobId;
}