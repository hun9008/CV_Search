const path = require('path');

// 프로젝트 루트 경로 (현재 파일 위치에서 두 단계 위)
const rootDir = path.resolve(__dirname, '../../');

module.exports = {
rootDir: rootDir,

  // 모듈 이름 매핑 (절대 경로 사용)
  moduleNameMapper: {
    "^@crawl/(.*)$": path.join(rootDir, "src/crawl/$1"),
    "^@database/(.*)$": path.join(rootDir, "src/database/$1"),
    "^@src/(.*)$": path.join(rootDir, "src/$1"),
    "^@test/(.*)$": path.join(rootDir, "test/$1"),
    "^@config/(.*)$": path.join(rootDir, "config/$1"),
    "^@utils/(.*)$": path.join(rootDir, "src/utils/$1"),
    "^@models/(.*)$": path.join(rootDir, "src/models/$1")
  },

  // 루트 디렉토리와 node_modules를 모듈 검색 경로에 포함
  modulePaths: [
    rootDir,
    path.join(rootDir, "node_modules")
  ],
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test/html-report', // HTML 리포트를 저장할 디렉터리 폴더 입니다
        filename: 'report.html', // 생성될 HTML 파일의 이름입니다
        openReport: true, // 테스트 종료시 HTML을 열어서 결과를 보여줍니다.
        includeFailureMsg: true, // 실패한 테스트 케이스의 실패 메시지를 포함시킵니다.
        expand: true,  // 테스트 스위트(상세 보기)를 확장할지 여부를 설정합니다.
      },
    ],
  ],
};