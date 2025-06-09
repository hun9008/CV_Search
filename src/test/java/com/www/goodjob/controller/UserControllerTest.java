package com.www.goodjob.controller;

import com.www.goodjob.config.TestSecurityConfig;
import com.www.goodjob.domain.User;
import com.www.goodjob.dto.UserDto;
import com.www.goodjob.enums.UserRole;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import(TestSecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("현재 로그인한 사용자 정보 조회 - 성공")
    void getCurrentUser_success() throws Exception {
        // given
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .name("홍길동")
                .role(UserRole.USER)
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(user);

        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        // when & then
        mockMvc.perform(get("/user/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.name").value("홍길동"))
                .andExpect(jsonPath("$.role").value("USER"));
    }


    @Test
    @DisplayName("accessToken 없이 요청 시 - 401 Unauthorized")
    void getCurrentUser_unauthorized() throws Exception {
        mockMvc.perform(get("/user/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("userDetails가 null인 경우 - 403 Forbidden 반환")
    void getCurrentUser_userDetailsIsNull() throws Exception {
        mockMvc.perform(get("/user/me")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(
                                new TestingAuthenticationToken(null, null))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("getCurrentUser() - userDetails가 null이면 401 반환")
    void getCurrentUser_unitTest_userDetailsNull() {
        UserController controller = new UserController(userRepository);

        ResponseEntity<UserDto> response = controller.getCurrentUser(null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

}