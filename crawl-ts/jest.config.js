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
  // Add path alias support from tsconfig.json
  moduleNameMapper: {
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@parser/(.*)$': '<rootDir>/src/parser/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@message/(.*)$': '<rootDir>/src/message/$1',
    '^@scripts/(.*)$': '<rootDir>/src/scripts/$1',
    '^@crawl/(.*)$': '<rootDir>/src/crawl/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@url/(.*)$': '<rootDir>/src/url/$1',
    // 원래 존재하는 tsconfig.json의 path alias들
    '^@_components/(.*)$': '<rootDir>/src/components/$1',
    '^@_apis/(.*)$': '<rootDir>/src/api/$1',
    '^@_types/(.*)$': '<rootDir>/src/types/$1',
    '^@_icons/(.*)$': '<rootDir>/public/assets/icons/$1',
    '^@_images/(.*)$': '<rootDir>/public/assets/images/$1',
    '^@_emojis/(.*)$': '<rootDir>/public/assets/emoji/$1'
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
        includeConsoleLog: false,
        sort: 'status',
        executionTimeWarningThreshold: 10,
        executionMode: 'reporter'
      }
    ]
  ],
};