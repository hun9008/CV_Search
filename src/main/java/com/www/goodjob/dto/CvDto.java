package com.www.goodjob.dto;

import com.www.goodjob.domain.Cv;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class CvDto {
    private Long id;
    private Long userId;
    private String fileName;
    private LocalDateTime uploadedAt;

    public static CvDto from(Cv cv) {
        return new CvDto(cv.getId(), cv.getUser().getId(), cv.getFileName(), cv.getUploadedAt());
    }
}