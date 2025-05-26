package com.www.goodjob.controller;

import com.www.goodjob.domain.User;
import com.www.goodjob.dto.UserDto;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
            ✅ accessToken 기반으로 현재 로그인한 사용자 정보를 반환함
        
            - 헤더에 `Authorization: Bearer <accessToken>` 필요
            - 유효하지 않거나 만료된 토큰인 경우 401 Unauthorized 반환
            - 유효한 경우 사용자 정보(email, name, role 등) 반환

            1. [비회원] accessToken 없이 /user/me 요청 시: 401 Unauthorized 응답
            2. [회원] accessToken 유효: 200 OK + 사용자 정보
        """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "사용자 정보 반환 성공"),
            @ApiResponse(responseCode = "401", description = "accessToken이 없거나 유효하지 않음")
    })
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            // Spring Security에서 일반적으로 이 로직까지 오지 않지만, 명시적으로 작성해도 좋음
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

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
