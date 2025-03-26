-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS goodjob DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 선택
USE goodjob;


-- 사용자 테이블 
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- 사용자 ID (자동 증가)
    email VARCHAR(255) UNIQUE NOT NULL,      -- 이메일 (고유 값)
    oauth_provider VARCHAR(20) NOT NULL,     -- OAuth 제공자 (Google, Kakao)
    oauth_id VARCHAR(255) UNIQUE,            -- OAuth 고유 ID (OAuth 로그인 시 사용)
    oauth_access_token TEXT DEFAULT NULL,  
    oauth_refresh_token TEXT DEFAULT NULL,  
    token_expiry TIMESTAMP DEFAULT NULL,      -- Access Token 만료 시간
    name VARCHAR(255) NOT NULL,              -- 사용자 이름
    address VARCHAR(255) NOT NULL,           -- 주소 (경기 수원과 같은 카테고리)
    role VARCHAR(10) DEFAULT 'user',         -- 역할 (일반 사용자, 관리자)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 계정 생성일
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 마지막 수정일
    UNIQUE(oauth_provider, oauth_id)         -- OAuth 고유 ID 중복 방지
);

-- 사용자 CV 테이블
CREATE TABLE cv (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- CV ID (자동 증가)
    user_id INT NOT NULL,                    -- 사용자 ID (외래 키)
    file_name VARCHAR(255) NOT NULL,         -- 업로드한 CV 파일 이름
    file_url VARCHAR(500) NOT NULL,          -- s3에 업로드된 CV 파일 URL (DB 크기 관리 + r/w 속도)
    raw_cv_text TEXT NOT NULL,               -- CV 원본 텍스트 (PDF에서 추출된 데이터)
    skills TEXT,                             -- Framework, 자격증 등 전반적인 스킬 정보
    education TEXT,                          -- 교육 이수 내용
    experience TEXT,                         -- 경력 사항
    awards TEXT,                             -- 수상 내역
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- CV 업로드 날짜
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 마지막 수정 날짜
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- 사용자가 삭제되면 CV도 삭제
);


-- 직무 공고 테이블 
CREATE TABLE jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,              -- 공고 ID (자동 증가)
    company_name VARCHAR(255) NOT NULL,             -- 회사명
    job_title VARCHAR(255) NOT NULL,                -- 직무 제목
    department VARCHAR(255),                        -- 모집 부서
    experience VARCHAR(20),                         -- 모집 경력 (신입, 중급, 고급, 인턴)
    description TEXT,                               -- 업무 내용 (상세 직무 설명)
    job_type VARCHAR(20),                           -- 근로 조건 (정규직, 계약직, 인턴)
    start_date DATE,                                -- 공고 시작일 (기존 posted_period 대체)
    end_date DATE,                                  -- 공고 마감일 (기존 posted_period 대체)
    requirements TEXT,                              -- 지원 조건 (필수 역량 및 요구 사항)
    preferred_qualifications TEXT,                  -- 우대 사항 (선택, 선호 역량)
    ideal_candidate TEXT,                           -- 인재상 (선택, 원하는 인재상)
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 공고 등록 날짜
    expires_at DATE,                                 -- 공고 만료 날짜
    raw_jobs_text TEXT NOT NULL,                    -- 모집공고 전체 원본 텍스트 (크롤링 데이터 원본)
    jobs_url VARCHAR(255) NOT NULL,                 -- 공고 URL
);


-- 📌 공고 북마크 테이블 
CREATE TABLE bookmarks (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- 북마크 ID (자동 증가)
    user_id INT NOT NULL,                    -- 사용자 ID (외래 키)
    job_id INT NOT NULL,                     -- 직무 공고 ID (외래 키)
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 저장된 시간
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- 사용자 삭제 시 북마크 삭제
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE -- 공고 삭제 시 북마크 삭제
);

-- 📌 관리자 로그 테이블 (수정됨)
CREATE TABLE admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- 로그 ID (자동 증가)
    admin_id INT NOT NULL,                   -- 관리자 ID (외래 키)
    action VARCHAR(255) NOT NULL,            -- 수행한 작업 (예: "사용자 삭제", "공고 수정")
    details TEXT,                            -- 변경된 내용 상세 기록
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 작업 수행 날짜
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE -- 관리자 삭제 시 로그 삭제
);