"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 크롤러 설정
 */
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// .env 파일 불러오기
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// 환경 변수에서 값 가져오기 (기본값 설정 포함)
exports.default = {
    CRAWLER: {
        START_URL: process.env.START_URL || 'https://recruit.navercorp.com/rcrt/list.do',
        DELAY_BETWEEN_REQUESTS: parseInt(process.env.DELAY_BETWEEN_REQUESTS || '2000', 10),
        MAX_URLS: parseInt(process.env.MAX_URLS || '100', 10),
        STRATEGY: process.env.STRATEGY || 'sequential', // 'sequential', 'random', 'specific'
        BASE_DOMAIN: process.env.BASE_DOMAIN || 'recruit.navercorp.com'
    },
    BROWSER: {
        HEADLESS: process.env.HEADLESS !== 'false',
        LAUNCH_ARGS: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920x1080'
        ],
        TIMEOUT: {
            PAGE_LOAD: parseInt(process.env.PAGE_LOAD_TIMEOUT || '30000', 10),
            SCRIPT_EXECUTION: parseInt(process.env.SCRIPT_EXECUTION_TIMEOUT || '15000', 10)
        }
    },
    PATHS: {
        ERROR_SCREENSHOTS_DIR: process.env.ERROR_SCREENSHOTS_DIR || './screenshot'
    },
    DATABASE: {
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/crawl_db'
    }
};
//# sourceMappingURL=config.js.map