package com.www.goodjob.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "favicons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Favicon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "text", nullable = false, unique = true)
    private String domain;

    @Column(columnDefinition = "text", nullable = false)
    private String logo;

}
