package com.www.goodjob.service;

import com.www.goodjob.domain.Cv;
import com.www.goodjob.domain.User;
import com.www.goodjob.repository.CvRepository;
import com.www.goodjob.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class S3ServiceTest {

    @Spy
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

    @Mock private AsyncService asyncService;

    private final String bucketName = "test-bucket";

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
        String key = "cv/" + fileName;

        doReturn(false).when(s3Service).fileExistsOnS3(key);

        // when
        String result = s3Service.saveCvIfUploaded(userId, fileName);

        // then
        assertEquals("s3에 파일이 존재하지 않습니다.", result);
        verifyNoInteractions(userRepository, cvRepository, restTemplate, asyncService);
    }

    @Test
    void saveCvIfUploaded_successfulFlow() throws Exception {
        // given
        Long userId = 1L;
        String fileName = "resume.pdf";
        String key = "cv/" + fileName;
        URL fakeUrl = new URL("https://example.com/" + key);

        User mockUser = new User();
        Cv mockCv = Cv.builder().id(42L).build();

        doReturn(true).when(s3Service).fileExistsOnS3(key);
        doReturn(fakeUrl).when(s3Service).getFileUrl(key);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(cvRepository.save(any(Cv.class))).thenReturn(mockCv);
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok("ok"));

        // when
        String result = s3Service.saveCvIfUploaded(userId, fileName);

        // then
        assertNull(result);
        verify(cvRepository).save(any(Cv.class));
        verify(asyncService).generateCvSummaryAsync(42L);
    }

    @Test
    void saveCvIfUploaded_fileDoesNotExist() {
        // given
        String fileName = "not_exists.pdf";
        Mockito.doReturn(false).when(s3Service).fileExistsOnS3("cv/" + fileName);

        // when
        String result = s3Service.saveCvIfUploaded(1L, fileName);

        // then
        assertEquals("s3에 파일이 존재하지 않습니다.", result);
    }

    @Test
    void saveCvIfUploaded_userNotFound() throws Exception {
        // given
        String fileName = "resume.pdf";
        String key = "cv/" + fileName;
        URL fakeUrl = new URL("https://example.com/" + key);

        Mockito.doReturn(true).when(s3Service).fileExistsOnS3(key);
        Mockito.doReturn(fakeUrl).when(s3Service).getFileUrl(key);
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        // expect
        assertThrows(RuntimeException.class, () ->
                s3Service.saveCvIfUploaded(99L, fileName));
    }

    @Test
    void saveCvIfUploaded_fastApiCallFails() throws Exception {
        // given
        Long userId = 1L;
        String fileName = "fail_resume.pdf";
        String key = "cv/" + fileName;
        URL fakeUrl = new URL("https://example.com/" + key);

        User mockUser = new User();
        Cv mockCv = Cv.builder().id(33L).build();

        Mockito.doReturn(true).when(s3Service).fileExistsOnS3(key);
        Mockito.doReturn(fakeUrl).when(s3Service).getFileUrl(key);
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(cvRepository.save(any())).thenReturn(mockCv);

        doThrow(new RestClientException("FastAPI 실패")).when(restTemplate)
                .postForEntity(anyString(), any(), eq(String.class));

        // mock delete
        doNothing().when(cvRepository).deleteById(33L);
        doNothing().when(s3Service).deleteFileName(fileName);

        // when
        String result = s3Service.saveCvIfUploaded(userId, fileName);

        // then
        assertEquals("FastAPI 실패", result);
        verify(cvRepository).deleteById(33L);
        verify(s3Service).deleteFileName(fileName);
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

        ReflectionTestUtils.setField(s3Service, "bucketName", "test-bucket");

        // when
        URL result = s3Service.getFileUrl(key);

        // then
        assertEquals(expectedUrl, result);

        ArgumentCaptor<GetUrlRequest> captor = ArgumentCaptor.forClass(GetUrlRequest.class);
        verify(s3Utilities).getUrl(captor.capture());

        GetUrlRequest captured = captor.getValue();
        assertEquals("test-bucket", captured.bucket());
        assertEquals(key, captured.key());
    }

    @Test
    void isFileNameAvailable_userExists_fileDoesNotExist_returnsTrue() {
        Long userId = 1L;
        String fileName = "resume.pdf";

        when(userRepository.existsById(userId)).thenReturn(true);
        when(cvRepository.existsByUserIdAndFileName(userId, fileName)).thenReturn(false);

        boolean result = s3Service.isFileNameAvailable(userId, fileName);
        assertTrue(result);
    }

    @Test
    void isFileNameAvailable_userExists_fileExists_returnsFalse() {
        Long userId = 1L;
        String fileName = "resume.pdf";

        when(userRepository.existsById(userId)).thenReturn(true);
        when(cvRepository.existsByUserIdAndFileName(userId, fileName)).thenReturn(true);

        boolean result = s3Service.isFileNameAvailable(userId, fileName);
        assertFalse(result);
    }

    @Test
    void isFileNameAvailable_userDoesNotExist_returnsFalse() {
        Long userId = 1L;
        String fileName = "resume.pdf";

        when(userRepository.existsById(userId)).thenReturn(false);

        boolean result = s3Service.isFileNameAvailable(userId, fileName);
        assertFalse(result);
    }

    @Test
    void isOwnedFile_fileExists_returnsTrue() {
        Long userId = 1L;
        String fileName = "resume.pdf";

        when(cvRepository.existsByUserIdAndFileName(userId, fileName)).thenReturn(true);

        boolean result = s3Service.isOwnedFile(userId, fileName);
        assertTrue(result);
    }

    @Test
    void isOwnedFile_fileDoesNotExist_returnsFalse() {
        Long userId = 1L;
        String fileName = "resume.pdf";

        when(cvRepository.existsByUserIdAndFileName(userId, fileName)).thenReturn(false);

        boolean result = s3Service.isOwnedFile(userId, fileName);
        assertFalse(result);
    }

    @Test
    void renameS3FileAndUpdateDB_successfulFlow() throws Exception {
        // given
        Long userId = 1L;
        String oldFileName = "old.pdf";
        String newFileName = "new.pdf";

        String oldKey = "cv/" + oldFileName;
        String newKey = "cv/" + newFileName;

        Cv mockCv = Cv.builder()
                .id(123L)
                .fileName(oldFileName)
                .fileUrl("https://old-url.com")
                .build();

        URL newUrl = new URL("https://s3.amazonaws.com/" + bucketName + "/" + newKey);

        when(cvRepository.findByUserIdAndFileName(userId, oldFileName)).thenReturn(Optional.of(mockCv));
        when(s3Client.utilities()).thenReturn(s3Utilities);
        when(s3Utilities.getUrl(any(GetUrlRequest.class))).thenReturn(newUrl);

        // when
        boolean result = s3Service.renameS3FileAndUpdateDB(userId, oldFileName, newFileName);

        // then
        assertTrue(result);

        ArgumentCaptor<CopyObjectRequest> copyCaptor = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client).copyObject(copyCaptor.capture());
        assertEquals(oldKey, copyCaptor.getValue().sourceKey());
        assertEquals(newKey, copyCaptor.getValue().destinationKey());

        ArgumentCaptor<DeleteObjectRequest> deleteCaptor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(deleteCaptor.capture());
        assertEquals(oldKey, deleteCaptor.getValue().key());

        ArgumentCaptor<Cv> savedCvCaptor = ArgumentCaptor.forClass(Cv.class);
        verify(cvRepository).save(savedCvCaptor.capture());
        Cv savedCv = savedCvCaptor.getValue();
        assertEquals(newFileName, savedCv.getFileName());
        assertEquals(newUrl.toString(), savedCv.getFileUrl());
    }

    @Test
    void renameS3FileAndUpdateDB_cvNotFound_returnsFalse() {
        // given
        Long userId = 1L;
        String oldFileName = "old.pdf";
        String newFileName = "new.pdf";

        // DB에서 Cv를 찾을 수 없음
        when(cvRepository.findByUserIdAndFileName(userId, oldFileName)).thenReturn(Optional.empty());

        // when
        boolean result = s3Service.renameS3FileAndUpdateDB(userId, oldFileName, newFileName);

        // then
        assertFalse(result);

        // DB save만 호출되지 않음을 검증
        verify(cvRepository, never()).save(any());

        // s3Client 호출은 일어날 수 있으므로 검증하지 않음
    }

    @Test
    void deleteAllFilesByUserId_deletesAllValidFiles() {
        // given
        Long userId = 1L;

        Cv cv1 = Cv.builder().fileName("file1.pdf").build();
        Cv cv2 = Cv.builder().fileName("file2.pdf").build();
        Cv cv3 = Cv.builder().fileName(null).build();          // 무시됨
        Cv cv4 = Cv.builder().fileName("  ").build();          // 무시됨

        List<Cv> cvs = List.of(cv1, cv2, cv3, cv4);
        when(cvRepository.findAllByUserId(userId)).thenReturn(cvs);

        // s3Service.deleteFileName 호출을 감시하기 위해 spy 사용
        doNothing().when(s3Service).deleteFileName(anyString());

        // when
        s3Service.deleteAllFilesByUserId(userId);

        // then
        verify(s3Service).deleteFileName("file1.pdf");
        verify(s3Service).deleteFileName("file2.pdf");
        verify(s3Service, times(2)).deleteFileName(anyString());
    }
}