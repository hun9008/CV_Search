package com.www.goodjob.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "job_region")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobRegion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // jobRegion 고유 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;
}
