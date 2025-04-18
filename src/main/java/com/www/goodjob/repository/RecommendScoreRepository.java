package com.www.goodjob.repository;

import com.www.goodjob.domain.RecommendScore;
import com.www.goodjob.domain.Cv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendScoreRepository extends JpaRepository<RecommendScore, Long> {

    // 특정 CV에 대한 추천 점수 리스트를 score 내림차순으로 정렬
    List<RecommendScore> findByCvOrderByScoreDesc(Cv cv);
}
