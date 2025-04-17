#!/usr/bin/env node

/**
 * 웹 콘텐츠 추출기(WebContentExtractor) 테스트 실행 및 HTML 리포트 생성 스크립트
 *
 * 이 스크립트는 WebContentExtractor 관련 테스트를 실행하고 HTML 형식의
 * 테스트 결과 리포트를 생성한 후 브라우저에서 열어줍니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 테스트 결과 리포트 경로
const TEST_REPORT_PATH = path.join(__dirname, 'test-results', 'test-report.html');

// 테스트 실행 및 리포트 준비
function runTests() {
  console.log('WebContentExtractor 테스트 실행 중...');

  try {
    // WebContentExtractor 테스트만 실행하기 위한 특정 패턴 지정
    execSync('npx jest test/content/WebContentExtractor.test.ts --reporters="jest-html-reporter"', {
      stdio: 'inherit'
    });

    // 테스트 결과 HTML 파일이 생성되었는지 확인
    if (fs.existsSync(TEST_REPORT_PATH)) {
      console.log(`\n테스트 완료! HTML 리포트 생성됨: ${TEST_REPORT_PATH}\n`);
      openReportInBrowser(TEST_REPORT_PATH);
    } else {
      console.error('\n테스트 리포트 파일을 찾을 수 없습니다.');
    }
  } catch (error) {
    // Jest 테스트가 실패해도 HTML 리포트는 생성됨
    if (fs.existsSync(TEST_REPORT_PATH)) {
      console.log(`\n테스트에 실패했습니다. 자세한 내용은 HTML 리포트를 확인하세요: ${TEST_REPORT_PATH}\n`);
      openReportInBrowser(TEST_REPORT_PATH);
    } else {
      console.error('\n테스트 실행 중 오류가 발생했습니다:', error.message);
    }
  }
}

// 플랫폼에 맞게 브라우저에서 파일 열기
function openReportInBrowser(filePath) {
  const platform = os.platform();

  try {
    // macOS
    if (platform === 'darwin') {
      execSync(`open "${filePath}"`);
    }
    // Windows
    else if (platform === 'win32') {
      execSync(`start "" "${filePath}"`);
    }
    // Linux
    else if (platform === 'linux') {
      execSync(`xdg-open "${filePath}"`);
    } else {
      console.log(`브라우저에서 결과를 자동으로 열 수 없습니다. 직접 다음 파일을 열어주세요: ${filePath}`);
    }
  } catch (error) {
    console.error('브라우저에서 파일을 여는 데 실패했습니다:', error.message);
    console.log(`직접 다음 파일을 열어주세요: ${filePath}`);
  }
}

// 테스트 실행
runTests();