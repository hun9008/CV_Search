ALTER TABLE jobs MODIFY COLUMN id BIGINT AUTO_INCREMENT;

ALTER TABLE jobs
ADD COLUMN is_public BOOLEAN DEFAULT TRUE AFTER ideal_candidate;

ALTER TABLE jobs
ADD COLUMN archived_at TIMESTAMP DEFAULT NULL AFTER is_public;

ALTER TABLE jobs
ADD COLUMN expires_at DATE AFTER posted_at;

-- 피드백 테이블
CREATE TABLE IF NOT EXISTS cv_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,               
    cv_id BIGINT NOT NULL,                              
    job_id BIGINT NOT NULL,                             
    feedback TEXT NOT NULL,                             
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     
    FOREIGN KEY (cv_id) REFERENCES cv(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(cv_id, job_id)                               
);

-- 북마크 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,              
    user_id BIGINT NOT NULL,                           
    job_id BIGINT NOT NULL,                            
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(user_id, job_id)                            
);

-- 지원 이력 테이블
CREATE TABLE IF NOT EXISTS applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                 
    user_id BIGINT NOT NULL,                              
    job_id BIGINT NOT NULL,                               
    apply_status ENUM('지원', '서류전형', '코테', '면접', '최종합격', '불합격') DEFAULT '지원',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    
    note TEXT,                                          
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 관리자 로그 테이블
CREATE TABLE IF NOT EXISTS admin_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                 
    admin_id BIGINT NOT NULL,                             
    action_type ENUM('USER_DELETE', 'JOB_UPDATE', 'FEEDBACK_REVIEW', 'SYSTEM_LOG', 'JOB_REGISTER'),
    details TEXT,                                       
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);