package com.www.goodjob.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FaviconController {

    @GetMapping("/favicon.ico")
    @ResponseBody
    public void returnNoFavicon() {
        // no-op → 200 OK 응답 (브라우저 리다이렉트 방지)
    }
}
