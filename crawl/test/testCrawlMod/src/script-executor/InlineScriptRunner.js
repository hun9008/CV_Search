// src/script-executor/InlineScriptRunner.js
class InlineScriptRunner extends ScriptExecutor {
  async execute(scripts, baseUrl) {
    const results = [];

    for (let i = 0; i < scripts.length; i++) {
      try {
        const script = scripts[i];
        const page = await this.createExecutionEnvironment(baseUrl);

        // 실행 전 URL 기록 및 로깅 설정
        const beforeUrl = await page.url();
        this.setupConsoleLogging(page, `스크립트 ${i+1}`);

        // 스크립트 실행 및 결과 수집
        const scriptResult = await this.executeScriptInPage(page, script.content, i+1);

        // URL 변경 감지
        const urlChangeInfo = await this.detectUrlChange(page, beforeUrl);
        Object.assign(scriptResult, urlChangeInfo);

        // 결과 데이터 가공
        scriptResult.originalScript = script.content.substring(0, 150) +
          (script.content.length > 150 ? '...' : '');
        scriptResult.sourceType = 'inline-script';
        scriptResult.index = i + 1;

        results.push(scriptResult);

        await this.browserManager.closePage(page);
      } catch (error) {
        results.push({
          sourceType: 'inline-script',
          index: i + 1,
          success: false,
          error: error.toString(),
          message: '실행 중 예외 발생'
        });
      }
    }

    return results;
  }

  async executeScriptInPage(page, scriptContent, index) {
    // 현재 코드에서의 스크립트 실행 로직
    return await page.evaluate(async (scriptContent) => {
      // 기존 스크립트 실행 코드
    }, scriptContent);
  }
}