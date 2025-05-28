class ScriptExecutor {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async executeScript(scriptContent, index) {
    // 자바스크립트 대화상자 처리
    this.page.on('dialog', async dialog => {
      console.log(`스크립트 ${index} 대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // 각 탭에 번호를 표시하기 위해 제목 변경
    await this.page.evaluate((idx) => {
      document.title = `스크립트 실행 ${idx}`;
    }, index);

    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

    // 콘솔 로그를 가로채서 출력
    this.page.on('console', msg => console.log(`스크립트 ${index} 콘솔:`, msg.text()));

    // 실행 전 URL 기록
    const beforeUrl = await this.page.url();

    // 페이지 내에서 스크립트 실행 및 URL 변경 감지
    const scriptResult = await this.page.evaluate(async (content) => {
      // 여기에 기존의 스크립트 실행 코드 삽입
      return new Promise(resolve => {
        // ... (기존 코드 그대로 사용)
      });
    }, scriptContent);

    // 실행 후 URL 확인
    const afterUrl = await this.page.url();

    // URL이 변경되었으나 감지되지 않았다면 결과 업데이트
    if (afterUrl !== beforeUrl && !scriptResult.urlChanged) {
      scriptResult.urlChanged = true;
      scriptResult.detectedUrl = afterUrl;
      scriptResult.message = 'URL 변경 감지됨 (페이지 이동 확인)';
    }

    // 결과 가공
    scriptResult.originalScript = scriptContent.substring(0, 150) + (scriptContent.length > 150 ? '...' : '');
    scriptResult.sourceType = 'inline-script';
    scriptResult.index = index;

    return scriptResult;
  }

  async executeOnclick(onclickCode, elementInfo, index) {
    // 자바스크립트 대화상자 처리
    this.page.on('dialog', async dialog => {
      console.log(`onclick ${index} 대화상자 감지: ${dialog.type()}, 메시지: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // 각 탭에 번호를 표시하기 위해 제목 변경
    await this.page.evaluate((idx) => {
      document.title = `onclick 실행 ${idx}`;
    }, index);

    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

    // 콘솔 로그를 가로채서 출력
    this.page.on('console', msg => console.log(`onclick ${index} 콘솔:`, msg.text()));

    // 실행 전 URL 기록
    const beforeUrl = await this.page.url();

    // onclick 함수 실행 및 URL 변경 감지 - 단순화된 버전
    const onclickResult = await this.page.evaluate(async (code, info) => {
      // 여기에 기존의 onclick 실행 코드 삽입
      return new Promise(resolve => {
        // ... (기존 코드 그대로 사용)
      });
    }, onclickCode, elementInfo);

    // 실행 후 URL 확인하여 변경 감지
    await new Promise(resolve => setTimeout(resolve, 1000));
    const afterUrl = await this.page.url();

    // URL 변경 여부 확인 및 결과 업데이트
    if (afterUrl !== beforeUrl) {
      onclickResult.urlChanged = true;
      onclickResult.detectedUrl = afterUrl;
      onclickResult.message = 'URL 변경 감지됨 (페이지 이동 확인)';
    } else {
      onclickResult.urlChanged = false;
      onclickResult.detectedUrl = null;
    }

    // 결과 가공
    onclickResult.originalScript = onclickCode;
    onclickResult.sourceType = 'onclick';
    onclickResult.index = index;
    onclickResult.elementInfo = elementInfo;

    return onclickResult;
  }
}

module.exports = { ScriptExecutor };