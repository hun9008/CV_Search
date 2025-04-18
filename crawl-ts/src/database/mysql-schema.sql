CREATE TABLE IF NOT EXISTS domains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain VARCHAR(255) NOT NULL UNIQUE,
  favicon TEXT,
  favicon_source VARCHAR(50),
  favicon_updated_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_domain (domain)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS urls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain_id INT NOT NULL,
  url VARCHAR(2048) NOT NULL,
  visited TINYINT(1) DEFAULT 0,
  title VARCHAR(512),
  html_content MEDIUMTEXT,
  status_code INT,
  error TEXT,
  discovered_at DATETIME,
  last_visited_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (domain_id) REFERENCES domains(id),
  UNIQUE INDEX idx_url_domain (url(191), domain_id),
  INDEX idx_visited (visited),
  INDEX idx_domain_visited (domain_id, visited)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recruitinfo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url_id INT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  company_name VARCHAR(255),
  job_title VARCHAR(512),
  job_description MEDIUMTEXT,
  location VARCHAR(255),
  job_type VARCHAR(100),
  salary VARCHAR(255),
  qualifications TEXT,
  benefits TEXT,
  application_deadline DATETIME,
  is_active TINYINT(1) DEFAULT 1,
  raw_content MEDIUMTEXT,
  parsed_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (url_id) REFERENCES urls(id),
  INDEX idx_domain (domain),
  INDEX idx_company (company_name),
  INDEX idx_is_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;