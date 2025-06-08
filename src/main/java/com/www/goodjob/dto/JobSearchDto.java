package com.www.goodjob.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class JobSearchDto {

    @JsonProperty("job_id")
    private Long jobId;
}