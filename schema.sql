CREATE DATABASE IF NOT EXISTS goodjob DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 선택
USE goodjob;

-- 사용자 정보 테이블
CREATE TABLE users (
                       id BIGINT PRIMARY KEY AUTO_INCREMENT,              -- 사용자 고유 ID
                       email VARCHAR(255) UNIQUE NOT NULL,                -- 사용자 이메일 (고유값)
                       name VARCHAR(100) NOT NULL,                        -- 사용자 이름
                       role ENUM('USER', 'ADMIN') DEFAULT 'USER',         -- 사용자 권한: 일반 사용자 또는 관리자
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 계정 생성 시간
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 마지막 수정 시간
);

-- OAuth 로그인 정보 테이블 (Google, Kakao 등)
CREATE TABLE user_oauth (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT,              -- OAuth 레코드 고유 ID
                            user_id BIGINT NOT NULL,                           -- users 테이블의 외래 키
                            provider VARCHAR(20) NOT NULL,                     -- OAuth 제공자 (예: google, kakao)
                            oauth_id VARCHAR(255) NOT NULL,                    -- OAuth 고유 ID (소셜 계정 ID)
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            UNIQUE(provider, oauth_id)                         -- 같은 provider+id는 중복 불가
);

-- 사용자 CV 테이블 (PDF 업로드 기반)
CREATE TABLE cv (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,              -- CV 고유 ID
                    user_id BIGINT NOT NULL,                           -- users 테이블 외래 키
                    file_name VARCHAR(255) NOT NULL,                   -- 업로드한 파일 이름
                    file_url VARCHAR(500) NOT NULL,                    -- S3 등 외부 저장소의 파일 URL
                    raw_text TEXT NOT NULL,                            -- 추출된 전체 CV 텍스트 (OCR 등)
                    skills TEXT,                                       -- 기술 스택, 프레임워크, 자격증 등
                    education TEXT,                                    -- 학력 / 교육 이수 내역
                    experience TEXT,                                   -- 프로젝트, 근무 경력 등
                    awards TEXT,                                       -- 수상 내역
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 업로드된 날짜
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 채용 공고 테이블
CREATE TABLE jobs (
                      id BIGINT PRIMARY KEY AUTO_INCREMENT,  -- 공고 고유 ID
                      company_name TEXT,               -- 회사 이름
                      title TEXT,                      -- 채용 공고 제목
                      region_id, BIGINT,               -- 지역 아이디    
                      department TEXT,                 -- 부서명
                      require_experience TEXT,         -- ["경력무관", "신입", "경력"]
                      job_description TEXT,            -- 직무 기술서. (이 직무는 뭐하는 )        
                      job_type TEXT,                    -- 근무 유형 (정규직/계약직/...) ["정규직", "계약직", "인턴","아르바이트","프리랜서","파견직"]                       
                      requirements TEXT,                                 -- 필수 요구 조건 -> filter skill
                      preferred_qualifications TEXT,                     -- 우대 조건 -> filter skill
                      ideal_candidate TEXT,                              -- 인재상
                      apply_start_date DATE,                             -- 채용 시작일
                      apply_end_date DATE,                               -- 채용 마감일
                      is_public BOOLEAN DEFAULT TRUE,                    -- ##사용자에게 노출 여부 (FALSE 시 숨김)
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 공고 등록된 날짜
                      expired_at TIMESTAMP DEFAULT NULL,                 -- 공고 내려간 날짜 
                      archived_at TIMESTAMP DEFAULT NULL,                -- ##관리자 또는 배치에 의해 숨겨진 날짜
                      raw_jobs_text TEXT NOT NULL,                       -- 전체 원문 텍스트 (크롤링 원본)
                      url TEXT                    -- 공고 상세보기 링크 (공식 페이지)
);

-- 피드백 테이블 (CV와 채용공고의 1:1 매칭 피드백)
CREATE TABLE cv_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,               -- 피드백 고유 ID
    cv_id BIGINT NOT NULL,                              -- 어떤 이력서에 대한 피드백인지
    job_id BIGINT NOT NULL,                             -- 어떤 공고와 비교한 피드백인지
    feedback TEXT NOT NULL,                             -- 부족한 점 등 피드백 내용
    score INT DEFAULT 0,                                -- 해당 CV와 공고 간 유사도 또는 매칭 점수
    confirmed BOOLEAN DEFAULT FALSE,                    -- 사용자가 해당 피드백을 확인했는지 여부
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- 피드백 생성 시간
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 피드백 갱신 시간
    FOREIGN KEY (cv_id) REFERENCES cv(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(cv_id, job_id)                               -- 한 CV와 한 공고의 피드백은 1개만
);


-- 북마크 테이블
CREATE TABLE bookmarks (
                           id BIGINT PRIMARY KEY AUTO_INCREMENT,              -- 북마크 고유 ID
                           user_id BIGINT NOT NULL,                           -- 북마크한 사용자
                           job_id BIGINT NOT NULL,                            -- 북마크한 공고
                           saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- 북마크 시점
                           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                           FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                           UNIQUE(user_id, job_id)                            -- 중복 북마크 방지
);

-- 지원 이력 테이블
CREATE TABLE applications (
                              id BIGINT PRIMARY KEY AUTO_INCREMENT,                 -- 지원 이력 고유 ID
                              user_id BIGINT NOT NULL,                              -- 지원한 사용자
                              job_id BIGINT NOT NULL,                               -- 지원한 공고
                              apply_status ENUM('지원', '서류전형', '코테', '면접', '최종합격', '불합격') DEFAULT '지원', -- 상태
                              applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 최초 지원일
                              note TEXT,                                          -- 사용자가 남긴 메모 또는 후기
                              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                              FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 관리자 로그 테이블 (작업 내역 기록용)
CREATE TABLE admin_logs (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT,                 -- 로그 고유 ID
                            admin_id BIGINT NOT NULL,                             -- 작업한 관리자 ID
                            action_type ENUM('USER_DELETE', 'JOB_UPDATE', 'FEEDBACK_REVIEW', 'SYSTEM_LOG', 'JOB_REGISTER'), -- 작업 종류
                            details TEXT,                                       -- 작업 상세 설명
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- 작업 시간
                            FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Region 테이블
CREATE TABLE regions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cd VARCHAR(10) NOT NULL UNIQUE,           -- 행정구역 코드
    sido VARCHAR(50) NOT NULL,                -- 시/도 (예: 서울특별시)
    sigungu VARCHAR(100) NOT NULL,            -- 시/군/구 (예: 강남구)
    x_coor VARCHAR(30),                       -- X 좌표 (UTM-K 기준)
    y_coor VARCHAR(30)                        -- Y 좌표 (UTM-K 기준)
);

-- -- 사용자 검색 히스토리 테이블
-- CREATE TABLE search_history (
--                                 id BIGINT PRIMARY KEY AUTO_INCREMENT,              -- 검색 기록 ID
--                                 user_id BIGINT NOT NULL,                           -- 검색한 사용자
--                                 keyword VARCHAR(255) NOT NULL,                     -- 검색어
--                                 searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 검색 시점
--                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );
