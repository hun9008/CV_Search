// src/utils/FileManager.js
const fs = require('fs').promises;

class FileManager {
  async saveJson(filename, data) {
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`데이터가 ${filename}에 저장되었습니다.`);
  }

  async saveResults(results, filename = 'script_execution_results.json') {
    await this.saveJson(filename, results);
  }

  async saveUrls(urls, baseUrl, filename = 'total_url.json') {
    const urlArray = urls.filter(url => url && typeof url === 'string' && url.startsWith('http'));
    const urlData = {
      baseUrl,
      totalUrls: urlArray.length,
      urls: urlArray.sort()
    };

    await this.saveJson(filename, urlData);
    return urlArray.length;
  }
}