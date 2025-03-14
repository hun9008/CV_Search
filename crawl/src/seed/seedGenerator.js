const getUrlSeed = require('./getUrlSeed');
const mongodbService = require('../database/mongodb-service');
const { URL } = require('url');
const path = require('path');
const fs = require('fs').promises;

/**
 * URL에서 도메인 추출
 * @param {string} url URL 문자열
 * @returns {string} 도메인명
 */
function extractDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/^www\./, '');
  } catch (error) {
    console.error(`URL 파싱 오류: ${url}`, error);
    return null;
  }
}

/**
 * seed URL을 수집하여 MongoDB에 domain : [suburl] 구조로 저장
 */
async function saveSeedsToMongoDB() {
  try {
    console.log('URL seed 생성 시작...');

    // URL 수집을 위한 객체 초기화
    const domainMap = new Map();
    const urlList = [];
    let urlIndex = 0;

    // 제너레이터 함수에서 URL 수집
    for await (const url of getUrlSeed()) {
      // URL 인덱스 및 배열에 추가
      urlList.push({ index: urlIndex++, url });

      // URL에서 도메인 추출
      const domain = extractDomain(url);
      if (!domain) continue;

      // 도메인별로 그룹화
      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          domain,
          url: `https://${domain}`,
          suburl_list: []
        });
      }

      // 하위 URL 추가
      domainMap.get(domain).suburl_list.push({
        url,
        visited: false,
        text: null,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // URL 목록 JSON 파일로 저장
    await fs.mkdir(path.join(__dirname, '../../data'), { recursive: true });
    await fs.writeFile(
      path.join(__dirname, '../../data/url_list.json'),
      JSON.stringify(urlList, null, 2),
      'utf8'
    );
    console.log(`총 ${urlList.length}개의 URL을 수집하여 url_list.json에 저장함`);

    // MongoDB 연결
    console.log('MongoDB에 연결 중...');
    await mongodbService.connect();
    console.log(`${domainMap.size}개의 도메인과 ${urlList.length}개의 URL을 MongoDB에 저장 중...`);

    // MongoDB에 도메인별로 저장
    const insertResults = [];
    for (const [domain, data] of domainMap.entries()) {
      try {
        // 도메인 추가 또는 업데이트
        const isNewDomain = await mongodbService.addOrUpdateDomain(domain, data.url);

        // 하위 URL 일괄 추가
        const addedCount = await mongodbService.bulkAddSubUrls(domain, data.suburl_list);

        insertResults.push({
          domain,
          new_domain: isNewDomain,
          urls_added: addedCount,
          total_urls: data.suburl_list.length
        });

        console.log(`도메인 ${domain}: ${addedCount}개의 URL 추가됨 (총 ${data.suburl_list.length}개)`);
      } catch (error) {
        console.error(`도메인 ${domain} 처리 중 오류:`, error);
      }
    }

    // 결과 저장
    await fs.writeFile(
      path.join(__dirname, '../../data/seed_results.json'),
      JSON.stringify(insertResults, null, 2),
      'utf8'
    );

    // 최종 통계 출력
    let totalDomainsAdded = 0;
    let totalUrlsAdded = 0;

    insertResults.forEach(result => {
      if (result.new_domain) totalDomainsAdded++;
      totalUrlsAdded += result.urls_added;
    });

    console.log(`URL seed 처리 완료: ${totalDomainsAdded}개의 새 도메인, ${totalUrlsAdded}개의 URL 추가됨`);

  } catch (error) {
    console.error('URL seed 생성 및 MongoDB 저장 중 오류:', error);
  } finally {
    // MongoDB 연결 종료
    await mongodbService.disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  saveSeedsToMongoDB().catch(console.error);
}

module.exports = {
  saveSeedsToMongoDB,
  extractDomain
};