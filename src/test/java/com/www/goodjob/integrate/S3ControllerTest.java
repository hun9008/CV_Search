package com.www.goodjob.integrate;

import com.www.goodjob.domain.User;
import com.www.goodjob.repository.UserRepository;
import com.www.goodjob.security.JwtTokenProvider;
import com.www.goodjob.service.S3Service;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class S3ControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private S3Service s3Service;

    @Test
    void confirmUpload_withValidJwt_returnsOk() throws Exception {
        String fakeToken = "mocked.jwt.token";

        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmail("test@example.com");

        given(jwtTokenProvider.getEmail(fakeToken)).willReturn("test@example.com");

        given(userRepository.findByEmail("test@example.com"))
                .willReturn(Optional.of(mockUser));

        given(s3Service.saveCvIfUploaded(1L, "test.pdf"))
                .willReturn(true);

        mockMvc.perform(post("/s3/confirm-upload")
                        .header("Authorization", "Bearer " + fakeToken)
                        .param("fileName", "test.pdf"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV 정보가 저장되었습니다."));
    }
}
