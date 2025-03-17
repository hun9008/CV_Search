/**
 * 크롤러 설정 파일
 * 도메인 제한, 파일 경로, 브라우저 설정 등 환경 설정을 관리합니다.
 */

const path = require('path');
const os = require('os');
require('dotenv').config();


// 기본 도메인 설정 - 크롤링 범위를 제한하기 위한 도메인 목록
const DOMAINS = {

  // 크롤링 시 무시할 도메인 패턴 (정규식 문자열)
  IGNORED: [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'youtube.com',
    'google.com',
    'analytics'
  ]
};

// 파일 경로 설정
const PATHS = {
  // 기본 데이터 디렉토리
  DATA_DIR: path.resolve(process.env.DATA_DIR || 'data'),
  ERROR_SCREENSHOTS_DIR : './screenshot',
  // 결과 파일
  RESULT_FILES: {
    // 로그 파일
    LOG_FILE: path.resolve(process.env.LOG_FILE || 'data/crawler.log')
  }
};

// 브라우저 설정
const BROWSER = {
  // 헤드리스 모드 (UI 없이 실행)
  HEADLESS: 'new',

  // 브라우저 실행 인수
  LAUNCH_ARGS: [
    '--disable-dev-shm-usage',  // 공유 메모리 사용 방지
    '--no-sandbox',             // 샌드박스 비활성화
    '--disable-setuid-sandbox', // setuid 샌드박스 비활성화
    '--disable-gpu',            // GPU 가속 비활성화
    '--disable-extensions',     // 확장 기능 비활성화
    '--disable-notifications',  // 알림 비활성화
    '--disable-popup-blocking'  // 팝업 차단 비활성화

  ],

  // 브라우저 타임아웃 설정 (밀리초)
  TIMEOUT: {
    PAGE_LOAD: 60000,          // 페이지 로드 타임아웃
    NAVIGATION: 30000,         // 탐색 타임아웃
    SCRIPT_EXECUTION: 5000,    // 스크립트 실행 타임아웃
    WAIT_FOR_SELECTOR: 5000    // 선택자 대기 타임아웃
  }
};

// 크롤링 설정
const CRAWLER = {
  // 최대 방문 URL 수
  MAX_URLS: parseInt(process.env.MAX_URLS || '100000000'),

  STRATEGY:'random',
  // 병렬 처리 수
  CONCURRENCY: {
    PAGES: parseInt(process.env.CONCURRENCY_PAGES || '3'),    // 동시에 열 수 있는 페이지 수
    SCRIPTS: parseInt(process.env.CONCURRENCY_SCRIPTS || '5') // 동시에 실행할 스크립트 수
  },
  BASE_DOMAIN:'career.naver.com',

  // 요청 사이 지연 시간 (밀리초)
  DELAY_BETWEEN_REQUESTS: parseInt(process.env.DELAY || '3000'),

  // 메모리 관리 설정
  MEMORY_MANAGEMENT: {
    CHECK_INTERVAL: 60000,                    // 메모리 체크 간격 (1분)
    MAX_MEMORY_USAGE: 0.8,                    // 최대 메모리 사용률 (80%)
    FORCED_GC_THRESHOLD: 0.7                  // 가비지 컬렉션 강제 실행 임계값 (70%)
  },

  // 최대 스크롤 횟수
  MAX_SCROLLS: parseInt(process.env.MAX_SCROLLS || '10'),

  // 최대 처리할 인라인 스크립트 수
  MAX_INLINE_SCRIPTS: parseInt(process.env.MAX_INLINE_SCRIPTS || '5'),

  // 최대 처리할 onclick 이벤트 수
  MAX_ONCLICK_EVENTS: parseInt(process.env.MAX_ONCLICK_EVENTS || '20')
};


// 데이터베이스 설정
const DATABASE = {
  // MongoDB 연결 정보
  MONGODB_ADMIN_URI: process.env.MONGODB_ADMIN_URI || 'mongodb://admin:password123@localhost:27017/admin',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://crawler_user:crawler_password@localhost:27017/crawler_db?authSource=crawler_db',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'crawler_db',
  MONGODB_USER: process.env.MONGODB_USER || 'crawler_user',
  MONGODB_PASSWORD: process.env.MONGODB_PASSWORD || 'crawler_password'
};

const TEST_DATABASE = {

  MONGODB_ADMIN_URI: 'mongodb://admin:password123@localhost:27017/admin',
  MONGODB_URI:  'mongodb://crawler_user:crawler_password@localhost:27017/crawler_db?authSource=crawler_db',
  MONGODB_DB_NAME:  'test',
  MONGODB_USER: 'crawler_user',
  MONGODB_PASSWORD:'crawler_password'
}




// 설정 값 중 환경 변수에 의해 재정의된 값 로그
function logEnvironmentOverrides() {
  const overrides = [];

  if (process.env.DATA_DIR) overrides.push(`DATA_DIR: ${process.env.DATA_DIR}`);
  if (process.env.MAX_URLS) overrides.push(`MAX_URLS: ${process.env.MAX_URLS}`);
  if (process.env.DELAY) overrides.push(`DELAY: ${process.env.DELAY}ms`);
  if (process.env.HEADLESS) overrides.push(`HEADLESS: ${process.env.HEADLESS}`);

  if (overrides.length > 0) {
    console.log('환경 변수에 의해 재정의된 설정:');
    overrides.forEach(override => console.log(`- ${override}`));
  }
}

// 설정 초기화 함수
function initializeConfig() {
  // 필요한 디렉토리 생성
  const fs = require('fs');
  const directories = [
    PATHS.DATA_DIR,
    PATHS.RESULT_FILES.CONTENT_DIR
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`디렉토리 생성됨: ${dir}`);
      } catch (error) {
        console.error(`디렉토리 생성 실패: ${dir}`, error);
      }
    }
  });

  // 환경 변수에 의해 재정의된 설정 로그
  logEnvironmentOverrides();

  console.log(`크롤링 설정 초기화 완료. 데이터 디렉토리: ${PATHS.DATA_DIR}`);
}

// 구성 객체
const CONFIG = {
  TEST_DATABASE,
  DATABASE,
  DOMAINS,
  PATHS,
  BROWSER,
  CRAWLER,
  initialize: initializeConfig
};

module.exports = CONFIG;