# CV_search



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


### 사용 가능한 스크립트

package.json에 정의된 다음 명령어로 다양한 작업을 실행할 수 있습니다:

```bash
# 크롤링 작업 시작
npm run crawl

# Jest를 사용한 테스트 실행
npm test

# 시드 데이터 생성
npm run seed

# 서버 시작
npm run server

# Gemini API를 이용한 데이터 파싱
npm run gemini-parse

# Claude API를 이용한 데이터 파싱
npm run claude-parse
```

#### 스크립트 설명

- `crawl`: src/crawl/baseWorkerManager를 실행하여 크롤링 프로세스를 시작합니다.
- `test`: Jest를 사용하여 모든 테스트를 실행합니다. 테스트 결과는 콘솔에 표시되며, HTML 리포트는 test/__tests__/html-report/report.html에 생성됩니다.
- `seed`: src/seed/seedGenerator를 실행하여 초기 데이터를 생성합니다.
- `server`: src/server/index를 실행하여 애플리케이션 서버를 시작합니다.
- `gemini-parse`: Google의 Gemini AI를 사용하여 크롤링된 데이터를 파싱합니다.
- `claude-parse`: Anthropic의 Claude AI를 사용하여 크롤링된 데이터를 파싱합니다.


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


