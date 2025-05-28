package com.www.goodjob.domain;

import com.www.goodjob.enums.EventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_event_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobEventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event", nullable = false)
    private EventType event;

    @Column(name = "timestamp", nullable = false, updatable = false, insertable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime timestamp;


}
