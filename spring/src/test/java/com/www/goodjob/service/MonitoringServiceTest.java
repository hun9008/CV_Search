package com.www.goodjob.service;

import com.www.goodjob.dto.ServerStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonitoringServiceTest {

    @InjectMocks
    private MonitoringService monitoringService;

    @Mock
    private RestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(monitoringService, "prometheusBaseUrl", "http://localhost:9090");
    }

    private String createMockResponse(double value) {
        return """
                {
                  "status": "success",
                  "data": {
                    "resultType": "vector",
                    "result": [
                      {
                        "metric": {},
                        "value": [ 1717770000.000, "%s" ]
                      }
                    ]
                  }
                }
                """.formatted(value);
    }

    @Test
    void getRedisStatus_returnsExpectedStatus() {
        String upJson = createMockResponse(1.0);
        String uptimeJson = createMockResponse(0.95);
        String latencyJson = createMockResponse(0.005);

        when(restTemplate.getForEntity(any(URI.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(upJson, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(uptimeJson, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(latencyJson, HttpStatus.OK));

        ServerStatus result = monitoringService.getRedisStatus();

        assertTrue(result.isUp());
        assertEquals("Redis Cache", result.getName());
        assertEquals(0.95, result.getUptime(), 1e-6);
        assertEquals(5.0, result.getResponseTime(), 1e-6);
    }

    @Test
    void getSpringStatus_returnsExpectedStatus() {
        String upJson = createMockResponse(1.0);
        String uptimeJson = createMockResponse(0.80);
        String latencyJson = createMockResponse(0.003);

        // 순서대로 반환되도록 설정
        when(restTemplate.getForEntity(any(URI.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(upJson, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(uptimeJson, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(latencyJson, HttpStatus.OK));

        ServerStatus result = monitoringService.getSpringStatus();

        assertTrue(result.isUp());
        assertEquals("Spring Server", result.getName());
        assertEquals(0.80, result.getUptime(), 1e-6);
        assertEquals(3.0, result.getResponseTime(), 1e-6);
    }

    @Test
    void getFastapiStatus_returnsExpectedStatus() {
        String upJson = createMockResponse(0.0);
        String uptimeJson = createMockResponse(0.5);
        String latencyJson = createMockResponse(0.01);

        // 순서대로 반환되도록 설정
        when(restTemplate.getForEntity(any(URI.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(upJson, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(uptimeJson, HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(latencyJson, HttpStatus.OK));

        ServerStatus result = monitoringService.getFastapiStatus();

        assertFalse(result.isUp());
        assertEquals("FastAPI Server", result.getName());
        assertEquals(0.5, result.getUptime(), 1e-6);
        assertEquals(10.0, result.getResponseTime(), 1e-6);
    }
}