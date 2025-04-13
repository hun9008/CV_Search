package com.www.goodjob.controller;

import com.www.goodjob.domain.User;
import com.www.goodjob.dto.UserDto;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.service.JwtTokenProvider;
import com.www.goodjob.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/user")
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtils.extractEmailFromHeader(authHeader);
        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(UserDto.from(user)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build()); // body 없음
    }

    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(@RequestHeader("Authorization") String authHeader,
                                         @RequestBody Map<String, String> body) {
        String email = jwtUtils.extractEmailFromHeader(authHeader);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        userRepository.save(user);

        return ResponseEntity.ok(UserDto.from(user));
    }

}
