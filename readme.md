
# CV_search

## Team Member

Team Member
| Name | Part | What I do |
|------|------|-----------|
| [팀장] 정용훈 | BE, AI | |
| [팀원] 육세현 | BE, DM | 모든 직무 데이터를 크롤링합니다. |
| ... | blk | blk |
| ... | blk | blk |


## Crwal 프로젝트 구조
```
crwal/
├── LICENSE
├── config
├── node_modules
├── package-lock.json
├── package.json
├── requirements.txt
├── src
└── test

```



## 설치 및 실행 방법

### 의존성 설치

```bash
npm install

```


### 애플리케이션 실행
이 명령은 `src/crawl/baseWorkerManager`를 실행하여 크롤링 프로세스를 시작합니다.

```bash
npm start

```

### 테스트 실행

```bash
npm test

```
이 명령은 Jest를 사용하여 모든 테스트를 실행합니다. 테스트 결과는 콘솔에 표시되며, HTML 리포트는 test/__tests__/html-report/report.html에 생성됩니다


## 환경설정

프로젝트는 module-alias를 사용하여 경로 별칭을 지원합니다. 다음과 같은 별칭이 정의되어 있습니다:

- @src - src 디렉토리
- @crawl - src/crawl 디렉토리
- @database - src/database/MongoDB 디렉토리
- @test - test 디렉토리
- @config - config 디렉토리

이를 통해 다음과 같이 모듈을 가져올 수 있습니다:

```js
const { BaseWorkerManager } = require('@crawl/baseWorkerManager');
const { checkMongoDBStatus } = require('@database/init-mongodb');
```

## DEVLOG

- logger 개발 및 테스트 ✅ (d)
- 도메인 직접 입력 및 테스트 (도메인 하나당 얼마나오는지 테스트)❌
- 서버메모리 사용량 테스트 및 메모리 누수 체크 ✅
- Page 닫아지는 닫아지는지 체크 및 테스트 ✅
- 오래실행되면 visitUrl이 오래 걸리면서 protocolError 발생 ❌
- url .pdf 등 제거 ❌
- LLM 연동 채용공고 데이터 1차 파싱 ✅
- LLM 연동 채용공고 데이터 2차 파싱 ✅
  

