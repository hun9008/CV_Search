package com.www.goodjob.enums;

import java.util.Arrays;
import java.util.List;

public enum ExperienceCategory {
    경력무관("경력무관"),
    신입("신입"),
    경력("경력");

    private final String label;

    ExperienceCategory(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static List<String> asList() {
        return Arrays.stream(values())
                .map(ExperienceCategory::getLabel)
                .toList();
    }
}
