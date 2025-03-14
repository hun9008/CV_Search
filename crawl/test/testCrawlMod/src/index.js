// src/index.js
const { Crawler } = require('./crawler/Crawler');
const config = require('./config/config');

async function main() {
  const targetUrl = process.argv[2] || 'https://recruit.navercorp.com/rcrt/list.do';
  console.log(`대상 URL: ${targetUrl}`);

  const crawler = new Crawler(config);
  const results = await crawler.crawl(targetUrl);

  console.log('모든 스크립트 실행이 완료되었습니다.');

  if (results.error) {
    console.error('오류가 발생했습니다:', results.error);
    return;
  }

  console.log(`총 ${results.length}개의 스크립트/onclick 이벤트 처리 결과가 있습니다.`);

  // URL 변경이 감지된 항목만 필터링
  const urlChanges = results.filter(r => r.urlChanged && r.detectedUrl);
  console.log(`URL 변경이 감지된 항목: ${urlChanges.length}개`);

  if (urlChanges.length > 0) {
    console.log('감지된 URL 목록:');
    urlChanges.forEach(item => {
      console.log(`- [${item.sourceType} #${item.index}] ${item.detectedUrl}`);
    });
  }
}

main().catch(error => {
  console.error('실행 중 오류가 발생했습니다:', error);
});