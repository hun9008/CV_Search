const fs = require('fs');
const path = require('path');

// 기본 설정
const defaultConfig = {
  browser: {
    headless: true,
    slowMo: 0,
    defaultViewport: null
  },
  crawler: {
    maxConcurrency: 5,
    timeout: 30000,
    waitUntil: 'networkidle2'
  },
  output: {
    dir: '.',
    resultFile: 'script_execution_results.json',
    urlFile: 'total_url.json'
  },
  script: {
    timeout: 3000,
    includeExternal: false
  }
};

// 설정 파일 로드
function loadConfig(configPath) {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const userConfig = JSON.parse(configData);
      return mergeConfigs(defaultConfig, userConfig);
    }
  } catch (error) {
    console.warn(`설정 파일을 로드하는 중 오류 발생: ${error.message}`);
  }

  return defaultConfig;
}

// 설정 병합
function mergeConfigs(defaultConfig, userConfig) {
  const result = { ...defaultConfig };

  for (const key in userConfig) {
    if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key]) &&
        typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = mergeConfigs(result[key], userConfig[key]);
    } else {
      result[key] = userConfig[key];
    }
  }

  return result;
}

// 설정 파일 경로
const configPath = path.join(process.cwd(), 'crawler.config.json');
const config = loadConfig(configPath);

module.exports = { config };