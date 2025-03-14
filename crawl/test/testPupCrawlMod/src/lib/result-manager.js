const fs = require('fs').promises;

class ResultManager {
  constructor(options = {}) {
    this.outputDir = options.outputDir || '.';
  }

  async saveResults(results, filename = 'script_execution_results.json') {
    const filePath = `${this.outputDir}/${filename}`;
    await fs.writeFile(filePath, JSON.stringify(results, null, 2));
    console.log(`실행 결과를 ${filePath} 파일에 저장했습니다.`);
    return filePath;
  }

  async saveUrls(urls, filename = 'total_url.json', baseUrl) {
    const filePath = `${this.outputDir}/${filename}`;

    const urlArray = Array.from(urls).filter(
      url => url && typeof url === 'string' && url.startsWith('http')
    );

    const urlData = {
      baseUrl,
      totalUrls: urlArray.length,
      urls: urlArray.sort()
    };

    await fs.writeFile(filePath, JSON.stringify(urlData, null, 2));
    console.log(`총 ${urlArray.length}개의 URL을 ${filePath} 파일에 저장했습니다.`);
    return filePath;
  }

  getUrlChanges(results) {
    return results.filter(r => r.urlChanged && r.detectedUrl);
  }

  summarizeResults(results) {
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      urlChanges: this.getUrlChanges(results).length
    };

    return summary;
  }
}

module.exports = { ResultManager };