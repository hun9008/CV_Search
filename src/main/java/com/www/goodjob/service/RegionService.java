// RegionService.java
package com.www.goodjob.service;

import com.www.goodjob.domain.Region;
import com.www.goodjob.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RegionService {

    private final RegionRepository regionRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${sgis.consumer-key}")
    private String consumerKey;

    @Value("${sgis.consumer-secret}")
    private String consumerSecret;

    public void fetchAllRegions() {
        List<String> sidoCodes = fetchAndSaveRegions(null);
        for (String sidoCd : sidoCodes) {
            fetchAndSaveRegions(sidoCd.substring(0, 2));
        }
    }

    public List<String> fetchAndSaveRegions(String cd) {
        String accessToken = getAccessToken();
        String url = "https://sgisapi.kostat.go.kr/OpenAPI3/addr/stage.json" +
                "?accessToken=" + accessToken +
                (cd != null ? "&cd=" + cd : "");

        System.out.println("URL: " + url);
        System.out.println("AccessToken: " + accessToken);

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        System.out.println("API 응답 결과: " + response.getBody());

        Object resultObject = response.getBody().get("result");
        if (!(resultObject instanceof List)) return Collections.emptyList();

        List<Map<String, String>> result = (List<Map<String, String>>) resultObject;

        List<String> nextLevelCodes = new ArrayList<>();
        for (Map<String, String> regionData : result) {
            String code = regionData.get("cd");
            if (regionRepository.existsByCd(code)) continue;

            String fullAddr = regionData.get("full_addr");
            String[] parts = fullAddr != null ? fullAddr.split(" ") : new String[0];
            String sido = parts.length > 0 ? parts[0] : "";
            String sigungu = parts.length > 1 ? parts[1] : "";

            Region region = Region.builder()
                    .cd(code)
                    .sido(sido)
                    .sigungu(sigungu)
                    .xCoor(regionData.get("x_coor"))
                    .yCoor(regionData.get("y_coor"))
                    .build();

            regionRepository.save(region);
            nextLevelCodes.add(code);
        }
        return nextLevelCodes;
    }

    private String getAccessToken() {
        String url = "https://sgisapi.kostat.go.kr/OpenAPI3/auth/authentication.json" +
                "?consumer_key=" + consumerKey +
                "&consumer_secret=" + consumerSecret;

        System.out.println("consumerKey = " + consumerKey);

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

        Object token = response.getBody().get("result");
        if (token instanceof Map) {
            return (String) ((Map<?, ?>) token).get("accessToken");
        }
        return null;
    }
}
