/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'jest-puppeteer',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/test/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  // Add HTML reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'WebContentExtractor Test Report',
        outputPath: './test-results/test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        sort: 'status',
        executionTimeWarningThreshold: 10,
        executionMode: 'reporter'
      }
    ]
  ],
};