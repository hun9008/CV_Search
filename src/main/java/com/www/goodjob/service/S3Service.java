package com.www.goodjob.service;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.User;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URL;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class S3Service {

    private final S3Presigner s3Presigner;
    private final S3Client s3Client;
    private final UserRepository userRepository;
    private final CvRepository cvRepository;
    private final RestTemplate restTemplate;

    @Value("${AWS_S3_BUCKET}")
    private String bucketName;

    @Value("${FASTAPI_HOST}")
    private String fastapiHost;

    public String generatePresignedUrl(String fileName) {
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key("cv/" + fileName)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(
                PutObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(10))
                        .putObjectRequest(objectRequest)
                        .build()
        );

        return presignedRequest.url().toString();
    }

    public boolean fileExists(String key) {
        try {
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.headObject(request);
            return true;
        } catch (S3Exception e) {
            return false;
        }
    }

    public URL getFileUrl(String key) {
        return s3Client.utilities().getUrl(GetUrlRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build());
    }

    public boolean saveCvIfUploaded(Long userId, String fileName) {
        String key = "cv/" + fileName;
        if (!fileExists(key)) return false;

        URL fileUrl = getFileUrl(key);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cv cv = Cv.builder()
                .user(user)
                .fileName(fileName)
                .fileUrl(fileUrl.toString())
                .rawText("Ready")
                .build();

        cvRepository.save(cv);

        try {
            String url = fastapiHost + "/save-es-cv";
            Map<String, Object> request = new HashMap<>();
            request.put("s3_url", fileUrl.toString());
            request.put("u_id", userId);

            restTemplate.postForEntity(url, request, String.class);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("[FastAPI 호출 실패] " + e.getMessage());
        }

        return true;
    }

    public void setBucketName(String bucketName) {
        this.bucketName = bucketName;
    }
}
