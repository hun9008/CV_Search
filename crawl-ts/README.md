# Crawl-TS

TypeScript로 재작성된 웹 크롤링 및 채용정보 추출 시스템입니다.

## 프로젝트 구조

```
crawl-ts/
├── src/               # 소스 코드
│   ├── crawler/       # 웹 크롤링 관련 코드
│   ├── database/      # 데이터베이스 연결 및 리포지토리
│   ├── message/       # 메시지 서비스 (RabbitMQ 등)
│   ├── models/        # 데이터 모델
│   ├── parser/        # 콘텐츠 파싱 관련 코드
│   ├── scripts/       # 유틸리티 스크립트
│   ├── server/        # API 서버
│   └── url/           # URL 관리
├── test/              # 테스트 코드
└── test-results/      # 테스트 결과 리포트
```

## 기술 스택

- TypeScript
- Node.js
- Puppeteer
- MongoDB
- MySQL
- Redis
- RabbitMQ
- Jest (테스트)

## 주요 기능

- 웹 페이지 크롤링
- 채용 정보 추출 및 분류
- 다양한 데이터베이스 지원 (MongoDB, MySQL)
- 메시지 큐를 통한 비동기 처리
- API 서버를 통한 데이터 제공

## 설계 패턴

이 프로젝트는 다음과 같은 설계 패턴을 활용합니다:

- **리포지토리 패턴**: 데이터 액세스를 추상화하여 비즈니스 로직과 데이터 액세스를 분리
- **전략 패턴**: 다양한 크롤링, 파싱 전략을 인터페이스로 추상화
- **의존성 주입**: 컴포넌트 간의 결합도를 낮추고 테스트 용이성 향상

## 테스트 커버리지

현재 테스트 커버리지 현황은 다음과 같습니다:

```
----------------------------------------------|---------|----------|---------|---------|-------------------
File                                          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------------------------------|---------|----------|---------|---------|-------------------
총 커버리지                                      | 66.20%  | 48.57%   | 70.47%  | 66.20%  |
----------------------------------------------|---------|----------|---------|---------|-------------------
```

주요 모듈별 커버리지:
- models/VisitResult.ts: 63.46% (함수 커버리지 10%)
- database 관련 리포지토리: 68.33%
- message 서비스: 57.25%
- parser 모듈: 72.40%

개선이 필요한 영역:
- VisitResult 클래스의 데이터베이스 상호작용 메서드 (save, findOne, find 등)
- 메시지 처리 관련 비동기 함수
- 특정 예외 처리 경로

## 설치 및 실행

### 요구사항

- Node.js 16+
- Docker (선택사항)
- MongoDB
- MySQL
- Redis
- RabbitMQ

### 설치

```bash
npm install
```

### 환경 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```
# 데이터베이스
MONGODB_ADMIN_URI=mongodb://localhost:27017
MONGODB_DB_NAME=crawler
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=crawler

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

# API 키
GEMINI_API_KEY=your_gemini_api_key
```

### 실행

```bash
# 개발 모드 실행
npm run dev

# 빌드
npm run build

# 프로덕션 모드 실행
npm start
```

### 테스트

```bash
# 모든 테스트 실행
npm test

# 특정 테스트 실행
npm test -- test/database/MySqlRecruitInfoRepository.test.ts

# 커버리지 보고서 생성
npm test -- --coverage
```

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새로운 기능 브랜치를 생성합니다: `git checkout -b feature/amazing-feature`
3. 변경사항을 커밋합니다: `git commit -m 'FEAT: Add amazing feature'`
4. 브랜치에 푸시합니다: `git push origin feature/amazing-feature`
5. Pull Request를 제출합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.