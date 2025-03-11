-- 📌 직무 공고 테이블
CREATE TABLE jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- 공고 ID (자동 증가)
    company_name VARCHAR(255) NOT NULL,      -- 회사명
    department VARCHAR(255) NOT NULL,        -- 모집 부서
    experience ENUM('entry', 'mid', 'senior', 'intern') NOT NULL,  -- 모집 경력 (신입, 중급, 고급, 인턴)
    description TEXT NOT NULL,               -- 업무 내용 (상세 직무 설명)
    job_type ENUM('full-time', 'part-time', 'intern', 'contract') NOT NULL,  -- 근로 조건 (정규직, 계약직, 인턴)
    posted_period VARCHAR(50) NOT NULL,      -- 공고 기간 (예: "25.00.00~25.00.00")
    requirements TEXT NOT NULL,              -- 지원 조건 (필수 역량 및 요구 사항)
    preferred_qualifications TEXT,           -- 우대 사항 (선택, 선호 역량)
    ideal_candidate TEXT,                    -- 인재상 (선택, 원하는 인재상)
    raw_text TEXT NOT NULL,                  -- 모집공고 전체 원본 텍스트 (크롤링 데이터 원본)
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 공고 등록 날짜
    expires_at DATE                          -- 공고 만료 날짜
);

-- 📌 사용자 테이블
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- 사용자 ID (자동 증가)
    email VARCHAR(255) UNIQUE NOT NULL,      -- 이메일 (고유 값)
    oauth_provider ENUM('google', 'kakao') NOT NULL,  -- OAuth 제공자 (Google, Kakao)
    oauth_id VARCHAR(255) UNIQUE,            -- OAuth 고유 ID (OAuth 로그인 시 사용)
    phone VARCHAR(20),                       -- 전화번호 (선택 사항)
    address TEXT,                            -- 주소 (선택 사항)
    role ENUM('user', 'admin') DEFAULT 'user',  -- 역할 (일반 사용자, 관리자)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 계정 생성일
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- 마지막 수정일
);

-- 📌 사용자 CV 테이블
CREATE TABLE cv (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- CV ID (자동 증가)
    user_id INT NOT NULL,                    -- 사용자 ID (외래 키)
    cv_text TEXT NOT NULL,                   -- CV 원본 텍스트 (PDF에서 추출된 데이터)
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- CV 업로드 날짜
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- 사용자가 삭제되면 CV도 삭제
);

-- 📌 공고 북마크 테이블 (사용자가 관심 있는 공고 저장)
CREATE TABLE bookmarks (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- 북마크 ID (자동 증가)
    user_id INT NOT NULL,                    -- 사용자 ID (외래 키)
    job_id INT NOT NULL,                     -- 직무 공고 ID (외래 키)
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 저장된 시간
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- 사용자 삭제 시 북마크 삭제
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE -- 공고 삭제 시 북마크 삭제
);

-- 📌 추천 시스템 테이블 (AI 추천 직무 저장)
CREATE TABLE recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- 추천 ID (자동 증가)
    user_id INT NOT NULL,                    -- 사용자 ID (외래 키)
    job_id INT NOT NULL,                     -- 추천된 직무 공고 ID (외래 키)
    match_score FLOAT NOT NULL,              -- 추천 점수 (0~100%)
    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 추천된 시간
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- 사용자 삭제 시 추천 내역 삭제
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE -- 공고 삭제 시 추천 내역 삭제
);

-- 📌 관리자 로그 테이블 (관리자 변경 이력 저장)
CREATE TABLE admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,       -- 로그 ID (자동 증가)
    admin_id INT NOT NULL,                   -- 관리자 ID (외래 키)
    action VARCHAR(255) NOT NULL,            -- 수행한 작업 (예: "사용자 삭제", "공고 수정")
    details TEXT,                            -- 변경된 내용 상세 기록
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 작업 수행 날짜
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE -- 관리자 삭제 시 로그 삭제
);