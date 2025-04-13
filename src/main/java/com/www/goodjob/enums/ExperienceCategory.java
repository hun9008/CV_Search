package com.www.goodjob.enums;

import java.util.Arrays;
import java.util.List;

public enum ExperienceCategory {
    경력무관,
    신입,
    _1_3년("1~3년"),
    _4_6년("4~6년"),
    _7_9년("7~9년"),
    _10_15년("10~15년"),
    _16_20년("16~20년");

    private final String label;

    ExperienceCategory() {
        this.label = this.name();
    }

    ExperienceCategory(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static List<String> asList() {
        return Arrays.stream(values()).map(ExperienceCategory::getLabel).toList();
    }
}
