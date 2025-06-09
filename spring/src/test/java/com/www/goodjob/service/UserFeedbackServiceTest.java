package com.www.goodjob.service;

import com.www.goodjob.domain.User;
import com.www.goodjob.domain.UserFeedback;
import com.www.goodjob.dto.UserFeedbackDto;
import com.www.goodjob.repository.UserFeedbackRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class UserFeedbackServiceTest {

    @Mock
    private UserFeedbackRepository feedbackRepository;

    @InjectMocks
    private UserFeedbackService userFeedbackService;

    private AutoCloseable closeable;

    private User user;

    @BeforeEach
    void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
        user = User.builder().id(1L).name("홍길동").build();
    }

    @Test
    @DisplayName("피드백 생성 성공")
    void createFeedback_shouldSaveFeedback() {
        UserFeedbackDto.Create dto = new UserFeedbackDto.Create("좋은 서비스입니다.", 5);
        userFeedbackService.createFeedback(user, dto);

        verify(feedbackRepository, times(1)).save(any(UserFeedback.class));
    }

    @Test
    @DisplayName("피드백 수정 성공")
    void updateFeedback_shouldUpdateAndSave() {
        Long id = 1L;
        UserFeedbackDto.Update dto = new UserFeedbackDto.Update("수정된 내용", 4);
        UserFeedback feedback = UserFeedback.builder().id(id).user(user).content("이전 내용").satisfactionScore(3).build();

        when(feedbackRepository.findById(id)).thenReturn(Optional.of(feedback));

        userFeedbackService.updateFeedback(id, dto);

        assertThat(feedback.getContent()).isEqualTo("수정된 내용");
        assertThat(feedback.getSatisfactionScore()).isEqualTo(4);
        verify(feedbackRepository).save(feedback);
    }

    @Test
    @DisplayName("본인 피드백 삭제 성공")
    void deleteMyFeedback_shouldDeleteIfOwner() {
        Long id = 1L;
        UserFeedback feedback = UserFeedback.builder().id(id).user(user).build();
        when(feedbackRepository.findById(id)).thenReturn(Optional.of(feedback));

        userFeedbackService.deleteMyFeedback(id, user);

        verify(feedbackRepository).delete(feedback);
    }

    @Test
    @DisplayName("본인 아닌 피드백 삭제 실패")
    void deleteMyFeedback_shouldThrowIfNotOwner() {
        Long id = 1L;
        User anotherUser = User.builder().id(2L).build();
        UserFeedback feedback = UserFeedback.builder().id(id).user(anotherUser).build();

        when(feedbackRepository.findById(id)).thenReturn(Optional.of(feedback));

        assertThrows(SecurityException.class, () -> userFeedbackService.deleteMyFeedback(id, user));
        verify(feedbackRepository, never()).delete(any());
    }

    @Test
    @DisplayName("전체 피드백 조회")
    void getAllFeedback_shouldReturnDtos() {
        UserFeedback feedback = UserFeedback.builder()
                .id(1L)
                .user(user)
                .content("내용")
                .satisfactionScore(5)
                .createdAt(LocalDateTime.now())
                .build();

        when(feedbackRepository.findAll()).thenReturn(List.of(feedback));

        var result = userFeedbackService.getAllFeedback();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getContent()).isEqualTo("내용");
    }

    @Test
    @DisplayName("기간별 피드백 조회 - week")
    void getFeedbackByPeriod_shouldReturnWeekly() {
        when(feedbackRepository.findByCreatedAtBetween(any(), any()))
                .thenReturn(List.of(UserFeedback.builder().id(1L).user(user).content("이번주 피드백").satisfactionScore(4).createdAt(LocalDateTime.now()).build()));

        var result = userFeedbackService.getFeedbackByPeriod("week");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getContent()).contains("피드백");
    }

    @Test
    @DisplayName("기간별 피드백 조회 - month")
    void getFeedbackByPeriod_shouldReturnMonthly() {
        when(feedbackRepository.findByCreatedAtBetween(any(), any()))
                .thenReturn(List.of(UserFeedback.builder().id(1L).user(user).content("이번달 피드백").satisfactionScore(4).createdAt(LocalDateTime.now()).build()));

        var result = userFeedbackService.getFeedbackByPeriod("month");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getContent()).contains("피드백");
    }

    @Test
    @DisplayName("기간별 피드백 조회 - year")
    void getFeedbackByPeriod_shouldReturnYearly() {
        when(feedbackRepository.findByCreatedAtBetween(any(), any()))
                .thenReturn(List.of(UserFeedback.builder().id(1L).user(user).content("올해 피드백").satisfactionScore(4).createdAt(LocalDateTime.now()).build()));

        var result = userFeedbackService.getFeedbackByPeriod("year");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getContent()).contains("피드백");
    }

    @Test
    @DisplayName("기간별 피드백 조회 - 유효하지 않은 기간")
    void getFeedbackByPeriod_shouldThrowOnInvalidPeriod() {
        assertThrows(IllegalArgumentException.class, () -> userFeedbackService.getFeedbackByPeriod("invalid_period"));
    }



    @Test
    @DisplayName("평균 만족도 조회")
    void getAverageSatisfaction_shouldCallRepository() {
        when(feedbackRepository.getAverageSatisfactionScore()).thenReturn(4.5);
        Double result = userFeedbackService.getAverageSatisfaction();
        assertThat(result).isEqualTo(4.5);
    }

    @Test
    @DisplayName("총 피드백 수 조회")
    void getTotalFeedbackCount_shouldCallRepository() {
        when(feedbackRepository.countTotalFeedback()).thenReturn(10L);
        Long result = userFeedbackService.getTotalFeedbackCount();
        assertThat(result).isEqualTo(10L);
    }

    @Test
    @DisplayName("사용자별 피드백 조회")
    void getFeedbackByUser_shouldReturnUserFeedback() {
        UserFeedback feedback = UserFeedback.builder()
                .id(1L)
                .user(user)
                .content("내 피드백")
                .satisfactionScore(4)
                .createdAt(LocalDateTime.now())
                .build();

        when(feedbackRepository.findByUser(user)).thenReturn(List.of(feedback));

        var result = userFeedbackService.getFeedbackByUser(user);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(user.getId());
        assertThat(result.get(0).getContent()).isEqualTo("내 피드백");
    }


    @Test
    @DisplayName("키워드 기반 피드백 검색")
    void searchFeedback_shouldReturnMatchingFeedback() {
        String keyword = "좋아요";
        UserFeedback feedback = UserFeedback.builder()
                .id(1L)
                .user(user)
                .content("너무 좋아요!")
                .satisfactionScore(5)
                .createdAt(LocalDateTime.now())
                .build();

        when(feedbackRepository.findByContentContaining(keyword)).thenReturn(List.of(feedback));

        var result = userFeedbackService.searchFeedback(keyword);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getContent()).contains("좋아요");
    }




    @AfterEach
    void tearDown() throws Exception {
        closeable.close();
    }
}
