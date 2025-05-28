package com.www.goodjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.www.goodjob.dto.ServerStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoringService {

    @Value("${monitoring.prometheus.url}")
    private String prometheusBaseUrl;

    private final RestTemplate restTemplate;

    private double parsePrometheusValue(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            JsonNode valueNode = root.path("data").path("result").get(0).path("value").get(1);
            return valueNode != null ? Double.parseDouble(valueNode.asText()) : 0.0;
        } catch (Exception e) {
            log.error("Prometheus 파싱 실패", e);
            return 0.0;
        }
    }

    public double queryMetricValue(String promQlQuery) {
        try {
            URI uri = UriComponentsBuilder
                    .fromHttpUrl(prometheusBaseUrl + "/api/v1/query")
                    .queryParam("query", promQlQuery)
                    .build(false) // 인코딩 생략
                    .toUri();

            log.info("Prometheus 요청 URI: {}", uri);

            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return parsePrometheusValue(response.getBody());
            } else {
                return 0.0;
            }

        } catch (Exception e) {
            log.error("Prometheus 요청 실패", e);
            return 0.0;
        }
    }

    private static final String REDIS_UP_QUERY = "up{job=\"redis\"}";
    private static final String REDIS_UPTIME_QUERY = "avg_over_time(up{job=\"redis\"}[1h])";
    private static final String REDIS_LATENCY_QUERY = "avg_over_time(scrape_duration_seconds{job=\"redis\"}[1m])";

    public ServerStatus getRedisStatus() {
        double up = queryMetricValue(REDIS_UP_QUERY);
        double uptimeRatio = queryMetricValue(REDIS_UPTIME_QUERY);
        double latency = queryMetricValue(REDIS_LATENCY_QUERY);
        return new ServerStatus("Redis Cache", up == 1.0, uptimeRatio, (latency * 1000));
    }

    private static final String SPRING_UP_QUERY = "up{job=\"spring-ec2\"}";
    private static final String SPRING_UPTIME_QUERY = "avg_over_time(up{job=\"spring-ec2\"}[1h])";
    private static final String SPRING_LATENCY_QUERY = "avg_over_time(scrape_duration_seconds{job=\"spring-ec2\"}[1m])";

    public ServerStatus getSpringStatus() {
        double up = queryMetricValue(SPRING_UP_QUERY);
        double uptimeRatio = queryMetricValue(SPRING_UPTIME_QUERY);
        double latency = queryMetricValue(SPRING_LATENCY_QUERY);
        return new ServerStatus("Spring Server", up == 1.0, uptimeRatio, (latency * 1000));
    }

    private static final String FASTAPI_UP_QUERY = "up{job=\"ecs-fastapi\"}";
    private static final String FASTAPI_UPTIME_QUERY = "avg_over_time(up{job=\"ecs-fastapi\"}[1h])";
    private static final String FASTAPI_LATENCY_QUERY = "avg_over_time(scrape_duration_seconds{job=\"ecs-fastapi\"}[1m])";

    public ServerStatus getFastapiStatus() {
        double up = queryMetricValue(FASTAPI_UP_QUERY);
        double uptimeRatio = queryMetricValue(FASTAPI_UPTIME_QUERY);
        double latency = queryMetricValue(FASTAPI_LATENCY_QUERY);

        return new ServerStatus("FastAPI Server", up == 1.0, uptimeRatio, (latency * 1000));
    }
}
