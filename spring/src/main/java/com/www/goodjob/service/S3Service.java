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
import java.util.List;
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
    private final AsyncService asyncService;

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

    public void deleteFileName(String fileName) {
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key("cv/" + fileName)
                .build();

        s3Client.deleteObject(deleteRequest);
        System.out.println("S3 파일 삭제 완료: " + fileName);
    }

    public void deleteAllFilesByUserId(Long userId) {
        List<Cv> cvs = cvRepository.findAllByUserId(userId);
        for (Cv cv : cvs) {
            String fileName = cv.getFileName();
            if (fileName != null && !fileName.isBlank()) {
                deleteFileName(fileName);
            }
        }
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

    public URL getFileUrl(String key) {
        return s3Client.utilities().getUrl(GetUrlRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build());
    }

    public String saveCvIfUploaded(Long userId, String fileName) {
        String key = "cv/" + fileName;
        if (!fileExistsOnS3(key)) return "s3에 파일이 존재하지 않습니다.";

        URL fileUrl = getFileUrl(key);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cv newCv = Cv.builder()
                .user(user)
                .fileName(fileName)
                .fileUrl(fileUrl.toString())
                .rawText("Ready")
                .uploadedAt(LocalDateTime.now())
                .build();
        Cv savedCv = cvRepository.save(newCv);
        Long cvId = savedCv.getId();
        log.info("새로운 cv 저장: userId={}, cvId={}", userId, cvId);

        try {
            String url = fastapiHost + "/save-es-cv";
            Map<String, Object> request = new HashMap<>();
            request.put("cv_id", cvId);
            request.put("s3_url", fileUrl.toString());

            restTemplate.postForEntity(url, request, String.class);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("[FastAPI 호출 실패] " + e.getMessage());

            if (savedCv != null) {
                cvRepository.deleteById(savedCv.getId());
            }
            deleteFileName(fileName);
            return e.getMessage();
        }
        asyncService.generateCvSummaryAsync(cvId);
        return null;
    }

    public boolean isFileNameAvailable(Long userId, String fileName) {
        if (!userRepository.existsById(userId)) {
            return false;
        }

        boolean exists = cvRepository.existsByUserIdAndFileName(userId, fileName);
        return !exists;
    }

    public boolean isOwnedFile(Long userId, String fileName) {
        return cvRepository.existsByUserIdAndFileName(userId, fileName);
    }

    public boolean renameS3FileAndUpdateDB(Long userId, String oldFileName, String newFileName) {
        String prefix = "cv/";
        String oldKey = prefix + oldFileName;
        String newKey = prefix + newFileName;

        // 1. S3 객체 복사
        CopyObjectRequest copyReq = CopyObjectRequest.builder()
                .sourceBucket(bucketName)
                .sourceKey(oldKey)
                .destinationBucket(bucketName)
                .destinationKey(newKey)
                .build();
        s3Client.copyObject(copyReq);

        // 2. 원래 객체 삭제
        DeleteObjectRequest delReq = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(oldKey)
                .build();
        s3Client.deleteObject(delReq);

        // 3. DB 업데이트
        Optional<Cv> cvOpt = cvRepository.findByUserIdAndFileName(userId, oldFileName);
        if (cvOpt.isPresent()) {
            Cv cv = cvOpt.get();
            cv.setFileName(newFileName);
            cv.setFileUrl(getFileUrl(newKey).toString());
            cvRepository.save(cv);
            return true;
        }

        return false;
    }

}
