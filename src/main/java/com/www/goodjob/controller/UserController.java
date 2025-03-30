package com.www.goodjob.controller;

import com.www.goodjob.domain.User;
import com.www.goodjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // POST /user/signup - 일반 회원가입 API (소셜 로그인 환경이더라도 추가 정보 입력 등 용도로 사용 가능)
    @PostMapping("/signup")
    public User signup(@RequestBody User user) {
        // 중복 이메일 체크 및 검증 로직 추가 가능
        return userRepository.save(user);
    }
}
