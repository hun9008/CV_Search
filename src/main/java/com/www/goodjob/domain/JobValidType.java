package com.www.goodjob.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "job_valid_type")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobValidType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; //

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @Column(name = "valid_type")
    private Integer validType;
}
