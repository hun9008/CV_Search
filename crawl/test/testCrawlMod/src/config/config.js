// src/config/config.js
module.exports = {
  browser: {
    headless: true,
    timeout: 60000,
    defaultViewport: null
  },
  script: {
    timeout: 3000,
    maxConcurrency: 5
  },
  output: {
    resultFile: 'script_execution_results.json',
    urlFile: 'total_url.json'
  }
};