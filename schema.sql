CREATE DATABASE IF NOT EXISTS goodjob DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 선택
USE goodjob;

-- 사용자 정보 테이블
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,              -- 사용자 고유 ID
    email VARCHAR(255) UNIQUE NOT NULL,                -- 사용자 이메일 (고유값)
    name VARCHAR(100) NOT NULL,                        -- 사용자 이름
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',         -- 사용자 권한: 일반 사용자 또는 관리자
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- 생성 일자
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 마지막 수정 일자
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- 생성 일자
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 마지막 수정 일자
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 채용 공고 테이블
CREATE TABLE jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,  -- 공고 고유 ID
    region_id BIGINT,                      -- 지역 아이디    
    company_name VARCHAR(255),             -- 회사 이름
    title VARCHAR(255),                    -- 채용 공고 제목
    department VARCHAR(255),               -- 부서명
    require_experience VARCHAR(255),       -- 요구 경력 ["경력무관", "신입", "경력"]
    job_type VARCHAR(255),                  -- 근무 유형 ["정규직", "계약직", "인턴","아르바이트","프리랜서","파견직"]                       
    requirements TEXT,                     -- 필수 요구 조건
    preferred_qualifications TEXT,         -- 우대 조건
    ideal_candidate TEXT,                  -- 인재상
    job_description TEXT,                  -- 직무 기술서
    apply_start_date DATE,                 -- 채용 시작일 (회사 입장)
    apply_end_date DATE,                   -- 채용 마감일 (회사 입장)
    is_public BOOLEAN DEFAULT TRUE,        -- 사용자에게 노출 여부
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 생성 일자 (서버 입장)
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 마지막 수정 일자 (서버 입장)
    expired_at DATETIME DEFAULT NULL,                 -- 공고 내려간 시간 (서버 입장)
    archived_at DATETIME DEFAULT NULL,                -- 공고 숨겨진 시간 (서버 입장)
    raw_jobs_text TEXT NOT NULL,                      -- 크롤링 원문
    url TEXT,                                          -- 공고 상세보기 링크
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL, -- 지역 외래 키
    favicon TEXT DEFAULT NULL,                             -- 파비콘 base64
    region_text VARCHAR(255) DEFAULT NULL
);

CREATE TABLE recommend_score (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                 -- 추천 점수 ID
    cv_id BIGINT NOT NULL,                                -- 이력서 ID
    job_id BIGINT NOT NULL,                               -- 공고 ID
    score FLOAT NOT NULL,                                 -- 추천 점수 (예: 0.0 ~ 1.0)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,        -- 생성 일자
    UNIQUE(cv_id, job_id),                                -- 동일 이력서-공고 중복 방지
    FOREIGN KEY (cv_id) REFERENCES cv(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 피드백 테이블 (CV와 채용공고의 매칭 피드백)
CREATE TABLE cv_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,               -- 피드백 고유 ID
    recommend_score_id BIGINT NOT NULL,                 -- 추천 점수 매핑 ID
    feedback TEXT NOT NULL,                             -- 피드백 내용
    confirmed BOOLEAN DEFAULT FALSE,                    -- 피드백 확인 여부
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 생성 일자 
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recommend_score_id) REFERENCES recommend_score(id) ON DELETE CASCADE,
    UNIQUE(recommend_score_id)                          -- 각 매칭마다 1개의 피드백만 가능
);

-- 북마크 테이블
CREATE TABLE bookmarks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,              -- 북마크 ID
    user_id BIGINT NOT NULL,                           -- 사용자 ID
    job_id BIGINT NOT NULL,                            -- 공고 ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- 생성 일자 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(user_id, job_id)                            -- 중복 방지
);

-- 지원 이력 테이블
CREATE TABLE applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                 -- 지원 이력 ID
    user_id BIGINT NOT NULL,                              -- 사용자 ID
    job_id BIGINT NOT NULL,                               -- 공고 ID
    apply_status ENUM('지원', '서류전형', '코테', '면접', '최종합격', '불합격') DEFAULT '지원', -- 상태
    note TEXT,                                            -- 메모
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,        -- 생성 일자 
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 마지막 수정 일자
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 관리자 로그 테이블
CREATE TABLE admin_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                 -- 로그 ID
    user_id BIGINT NOT NULL,                              -- 사용자 ID (user's role is ADMIN)
    action_type ENUM('USER_DELETE', 'JOB_UPDATE', 'FEEDBACK_REVIEW', 'SYSTEM_LOG', 'JOB_REGISTER'), -- 작업 종류
    details TEXT,                                         -- 상세 설명
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,        -- 생성 일자 
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 마지막 수정 일자
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Region 테이블
CREATE TABLE regions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cd VARCHAR(10) NOT NULL UNIQUE,       -- 행정구역 코드 (10자리)
    sido VARCHAR(20) NOT NULL,            -- 시/도 (예: 서울, 경기)
    sigungu VARCHAR(50)                   -- 시/군/구 (예: 종로구, 수원시 영통구) 
    -- 시도만 있고 시군구 null 가능 (예: 서울, null)
);

-- -- 사용자 검색 히스토리 테이블
-- CREATE TABLE search_history (
--                                 id BIGINT PRIMARY KEY AUTO_INCREMENT,              -- 검색 기록 ID
--                                 user_id BIGINT NOT NULL,                           -- 검색한 사용자
--                                 keyword VARCHAR(255) NOT NULL,                     -- 검색어
--                                 searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 검색 시점
--                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );
