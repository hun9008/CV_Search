package com.www.goodjob.integrate;

import com.www.goodjob.dto.ScoredJobDto;
import com.www.goodjob.service.AsyncService;
import com.www.goodjob.service.RecommendService;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("mysql-test")
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class RecommendServiceIntegrationTest {

    @Autowired
    private RecommendService recommendService;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private AsyncService asyncService;

    private final Long testCvId = 154L;
    private final int topk = 10;

    static {
        Dotenv dotenv = Dotenv.configure()
                .directory("src/test/resources")  // 또는 절대경로
                .filename(".env.test")
                .load();

        // 모든 환경변수 System Property에 등록
        dotenv.entries().forEach(entry ->
                System.setProperty(entry.getKey(), entry.getValue())
        );
    }

    @BeforeEach
    void clearRedisCache() {
        String zsetKey = "recommendation:" + testCvId;
        Boolean deleted = redisTemplate.delete(zsetKey);
        System.out.println("[Setup] Redis 캐시 삭제 여부: " + deleted);
    }

    @Test
    void requestRecommendation_캐시없을때_FASTAPI_호출과_시간측정() {
        long start = System.nanoTime();
        List<ScoredJobDto> apiResult = recommendService.testFetchRecommendationOnly(testCvId, topk);
        long end = System.nanoTime();

        long durationMs = (end - start) / 1_000_000;
        System.out.println("[통합 테스트] FastAPI 직접 호출 수행 시간: " + durationMs + "ms");

        assertTrue(durationMs <= 5000, "FastAPI 호출이 5초 이내에 완료되어야 합니다.");

        assertFalse(apiResult.isEmpty(), "FastAPI가 추천을 반환해야 합니다.");
        apiResult.forEach(dto -> System.out.println("추천 결과: " + dto.getId() + " - " + dto.getTitle()));
    }

    @Test
    void fetchAndSaveRecommendation_직렬처리_시간측정() {
        clearRedisCache();

        long fetchStart = System.nanoTime();
        List<ScoredJobDto> apiResult = recommendService.testFetchRecommendationOnly(testCvId, topk);
        long fetchEnd = System.nanoTime();
        long fetchDurationMs = (fetchEnd - fetchStart) / 1_000_000;
        System.out.println("[테스트] FastAPI 호출 시간: " + fetchDurationMs + "ms");

        assertFalse(apiResult.isEmpty(), "FastAPI에서 추천 결과가 반환되어야 합니다.");

        long cacheStart = System.nanoTime();
        String zsetKey = "recommendation:" + testCvId;

        redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (ScoredJobDto dto : apiResult) {
                connection.zAdd(
                        zsetKey.getBytes(StandardCharsets.UTF_8),
                        dto.getScore(),
                        String.valueOf(dto.getId()).getBytes(StandardCharsets.UTF_8)
                );
            }
            return null;
        });

        redisTemplate.expire(zsetKey, Duration.ofHours(6));
        long cacheEnd = System.nanoTime();
        long cacheDurationMs = (cacheEnd - cacheStart) / 1_000_000;
        System.out.println("[테스트] Redis 캐싱 시간: " + cacheDurationMs + "ms");

        long readStart = System.nanoTime();
        List<ScoredJobDto> cachedResult = recommendService.getScoredFromCache(testCvId, topk);
        long readEnd = System.nanoTime();
        long readDurationMs = (readEnd - readStart) / 1_000_000;

        System.out.println("[테스트] Redis 조회 시간: " + readDurationMs + "ms");
        System.out.println("[테스트] 캐시된 추천 개수: " + cachedResult.size());

        assertTrue(readDurationMs <= 1000, "Redis 조회는 1초 이내에 완료되어야 합니다.");
        assertFalse(cachedResult.isEmpty(), "캐시된 추천 결과가 있어야 합니다.");
    }
}
