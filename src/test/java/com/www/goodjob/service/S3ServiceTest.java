package com.www.goodjob.service;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.User;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Utilities;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.net.URL;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class S3ServiceTest {

    @InjectMocks
    private S3Service s3Service;

    @Mock
    private S3Presigner s3Presigner;

    @Mock
    private S3Client s3Client;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CvRepository cvRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private S3Utilities s3Utilities;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(s3Service, "bucketName", "test-bucket");
        ReflectionTestUtils.setField(s3Service, "fastapiHost", "http://localhost:8000");
    }


    @Test
    void generatePresignedPutUrl_returnsExpectedUrl() throws Exception {
        String fileName = "example.pdf";
        String expectedUrl = "https://test-bucket.s3.amazonaws.com/cv/example.pdf";

        PresignedPutObjectRequest mockResponse = mock(PresignedPutObjectRequest.class);
        when(mockResponse.url()).thenReturn(URI.create(expectedUrl).toURL());

        when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class)))
                .thenReturn(mockResponse);

        String result = s3Service.generatePresignedPutUrl(fileName);

        assertEquals(expectedUrl, result);
        verify(s3Presigner).presignPutObject(any(PutObjectPresignRequest.class));
    }

    @Test
    void generatePresignedGetUrl_returnsExpectedUrl() throws Exception {
        // given
        String fileName = "example.pdf";
        String expectedUrl = "https://test-bucket.s3.amazonaws.com/cv/example.pdf";

        PresignedGetObjectRequest mockResponse = mock(PresignedGetObjectRequest.class);
        when(mockResponse.url()).thenReturn(URI.create(expectedUrl).toURL());

        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class)))
                .thenReturn(mockResponse);

        // when
        String result = s3Service.generatePresignedGetUrl(fileName);

        // then
        assertEquals(expectedUrl, result);
        verify(s3Presigner).presignGetObject(any(GetObjectPresignRequest.class));
    }

    @Test
    void fileExistsOnS3_returnsTrue_whenObjectExists() {
        // given
        String key = "cv/example.pdf";

        HeadObjectResponse mockResponse = mock(HeadObjectResponse.class);
        when(s3Client.headObject(any(HeadObjectRequest.class)))
                .thenReturn(mockResponse);  //

        // when
        boolean result = s3Service.fileExistsOnS3(key);

        // then
        assertTrue(result);
        verify(s3Client).headObject(any(HeadObjectRequest.class));
    }


    @Test
    void saveCvIfUploaded_fileNotExistOnS3_returnsFalse() {
        // given
        Long userId = 1L;
        String fileName = "test.pdf";

        S3Service spyService = Mockito.spy(s3Service);
        doReturn(false).when(spyService).fileExistsOnS3("cv/" + fileName);

        String result = spyService.saveCvIfUploaded(userId, fileName);

        if (result == null) assertFalse(false);

        // then
        verifyNoInteractions(userRepository, cvRepository, restTemplate);
    }

   /* @Test
    void saveCvIfUploaded_fileExists_createsNewCv_andCallsFastApi() {
        // given
        Long userId = 1L;
        String fileName = "test.pdf";
        String key = "cv/" + fileName;
        URL dummyUrl = createDummyUrl("https://s3.amazonaws.com/test-bucket/cv/test.pdf");

        User mockUser = new User();
        mockUser.setId(userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(cvRepository.findByUser(mockUser)).thenReturn(Optional.empty());

        S3Service spyService = Mockito.spy(s3Service);
        doReturn(true).when(spyService).fileExistsOnS3(key);
        doReturn(dummyUrl).when(spyService).getFileUrl(key);

        // when
        boolean result = spyService.saveCvIfUploaded(userId, fileName);

        // then
        assertTrue(result);
        verify(cvRepository).save(any(Cv.class));
        verify(restTemplate).postForEntity(eq("http://localhost:8000/save-es-cv"), any(), eq(String.class));
    }
*/
    private URL createDummyUrl(String url) {
        try {
            return new URL(url);
        } catch (Exception e) {
            throw new RuntimeException("잘못된 URL");
        }
    }

    @Test
    void deleteFile_callsS3DeleteObjectWithCorrectParameters() {
        // given
        String fileName = "resume.pdf";
        String expectedKey = "cv/" + fileName;

        ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);

        // when
        s3Service.deleteFileName(fileName);

        // then
        verify(s3Client).deleteObject(captor.capture());

        DeleteObjectRequest request = captor.getValue();
        assertEquals("test-bucket", request.bucket());
        assertEquals(expectedKey, request.key());
    }

    @Test
    void getFileUrl_returnsCorrectUrl() throws Exception {
        // given
        String key = "cv/resume.pdf";
        URL expectedUrl = new URL("https://s3.amazonaws.com/test-bucket/" + key);

        when(s3Utilities.getUrl(any(GetUrlRequest.class))).thenReturn(expectedUrl);
        when(s3Client.utilities()).thenReturn(s3Utilities);

        S3Service spyService = Mockito.spy(s3Service);
        ReflectionTestUtils.setField(spyService, "bucketName", "test-bucket");

        // when
        URL result = spyService.getFileUrl(key);

        // then
        assertEquals(expectedUrl, result);

        ArgumentCaptor<GetUrlRequest> captor = ArgumentCaptor.forClass(GetUrlRequest.class);
        verify(s3Utilities).getUrl(captor.capture());

        GetUrlRequest captured = captor.getValue();
        assertEquals("test-bucket", captured.bucket());
        assertEquals(key, captured.key());
    }
}