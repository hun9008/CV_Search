package com.www.goodjob.service;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.User;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URL;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
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

    public String generatePresignedPutUrl(String fileName) {
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

    public String generatePresignedGetUrl(String fileName) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key("cv/" + fileName)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(
                GetObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(10))  // 유효 시간 설정
                        .getObjectRequest(getObjectRequest)
                        .build()
        );

        return presignedRequest.url().toString();
    }

    public void deleteFile(String fileName) {
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key("cv/" + fileName)
                .build();

        s3Client.deleteObject(deleteRequest);
        System.out.println("파일 삭제 완료: " + fileName);
    }


    public boolean fileExistsOnS3(String key) {
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

    public boolean fileExists(Long userId, String fileName) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return cvRepository.findByUserAndFileName(user, fileName).isEmpty();
    }

    public URL getFileUrl(String key) {
        return s3Client.utilities().getUrl(GetUrlRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build());
    }

    public boolean saveCvIfUploaded(Long userId, String fileName) {
        String key = "cv/" + fileName;
        if (!fileExistsOnS3(key)) return false;

        URL fileUrl = getFileUrl(key);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Cv> existingCvOpt = cvRepository.findByUser(user);

        // DB에 없으면 저장
        if (existingCvOpt.isEmpty()) {
            Cv newCv = Cv.builder()
                    .user(user)
                    .fileName(fileName)
                    .fileUrl(fileUrl.toString())
                    .rawText("Ready")
                    .uploadedAt(LocalDateTime.now())
                    .build();
            cvRepository.save(newCv);
            log.info("새로운 cv 저장 {}", userId);
        } else {
            // 기존 CV 업데이트
            Cv existingCv = existingCvOpt.get();
            existingCv.setFileName(fileName);
            existingCv.setFileUrl(fileUrl.toString());
            existingCv.setUploadedAt(LocalDateTime.now());
            cvRepository.save(existingCv);  // save는 merge를 수행
            log.info("기존 CV 업데이트: userId={}, fileName={}", userId, fileName);
        }

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

}
