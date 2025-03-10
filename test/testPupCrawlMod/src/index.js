const { CrawlerManager } = require('./lib/crawler-manager');

async function main() {
  const targetUrl = process.argv[2] || 'https://recruit.navercorp.com/rcrt/list.do';
  console.log(`대상 URL: ${targetUrl}`);

  const crawler = new CrawlerManager({
    headless: true,
    maxConcurrency: 5,  // 최대 병렬 작업 수
    outputDir: '.'      // 결과 파일 저장 경로
  });

  try {
    const results = await crawler.crawl(targetUrl);
    console.log('모든 스크립트 실행이 완료되었습니다.');
    console.log(`총 ${results.length}개의 스크립트/onclick 이벤트 처리 결과가 있습니다.`);

    // URL 변경이 감지된 항목 필터링
    const urlChanges = crawler.getURLChanges();
    console.log(`URL 변경이 감지된 항목: ${urlChanges.length}개`);

    if (urlChanges.length > 0) {
      console.log('감지된 URL 목록:');
      urlChanges.forEach(item => {
        console.log(`- [${item.sourceType} #${item.index}] ${item.detectedUrl}`);
      });
    }
  } catch (error) {
    console.error('크롤링 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await crawler.close();
  }
}

// 스크립트가 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main().catch(error => {
    console.error('실행 중 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = { main };