main()
└── extractAndExecuteScripts(targetUrl)
    ├── puppeteer.launch() - 브라우저 인스턴스 생성
    ├── browser.newPage() - 메인 페이지 생성
    ├── page.goto(url) - 대상 URL로 이동
    ├── page.url() - 현재 URL 가져오기
    ├── page.evaluate() - 페이지에서 스크립트와 링크 추출
    │   ├── document.querySelectorAll('script') - 스크립트 태그 수집
    │   └── document.querySelectorAll('a[href]') - 링크 수집
    │
    ├── 인라인 스크립트 반복 처리
    │   └── for 각 인라인 스크립트:
    │       ├── browser.newPage() - Worker용 새 페이지 생성
    │       ├── workerPage.goto('about:blank') - 빈 페이지 이동
    │       └── workerPage.evaluate() - Worker에서 스크립트 실행
    │           ├── Web Worker 생성
    │           │   ├── Blob 생성 및 Worker 초기화
    │           │   ├── location 메소드 오버라이드 (감지용)
    │           │   ├── 스크립트 eval() 실행
    │           │   └── 결과 메시지 반환
    │           │
    │           └── Promise.resolve() - Worker 결과 반환
    │       ├── 결과를 scriptResults 배열에 추가
    │       └── workerPage.close() - Worker 페이지 종료
    │
    ├── 결과 객체 구성 및 URL 변경 필터링
    ├── fs.writeFileSync() - 결과 파일 저장
    └── browser.close() - 브라우저 종료

최종 결과 반환