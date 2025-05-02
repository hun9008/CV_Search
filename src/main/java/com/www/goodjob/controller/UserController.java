package com.www.goodjob.controller;

import com.www.goodjob.domain.User;
import com.www.goodjob.dto.UserDto;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/user")
public class UserController {

    private final UserRepository userRepository;

    @Operation(
            summary = "현재 로그인한 사용자 정보 조회",
            description = """
            로그인한 사용자 정보를 반환함
            """
    )
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        return ResponseEntity.ok(UserDto.from(user));
    }

//    @PostMapping("/profile")
//    public ResponseEntity<?> saveProfile(@AuthenticationPrincipal CustomUserDetails userDetails,
//                                         @RequestBody Map<String, String> body) {
//        User user = userDetails.getUser();
//
//        // body에서 원하는 값 꺼내서 user에 반영 가능 (예: 이름, 닉네임 등)
//        if (body.containsKey("name")) {
//            user.setName(body.get("name"));
//        }
//
//        userRepository.save(user);
//        return ResponseEntity.ok(UserDto.from(user));
//    }
}
