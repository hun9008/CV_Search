package com.www.goodjob.enums;

import java.util.Arrays;
import java.util.List;

public enum JobTypeCategory {
    정규직,
    계약직,
    인턴,
    아르바이트,
    프리랜서,
    파견직;

    public static List<String> asList() {
        return Arrays.stream(values()).map(Enum::name).toList();
    }
}