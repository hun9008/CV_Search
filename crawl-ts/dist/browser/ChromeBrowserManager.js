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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromeBrowserManager = void 0;
const logger_1 = require("../utils/logger");
const config_1 = __importDefault(require("../config/config"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Chrome 브라우저 관리 구현체
 * Puppeteer를 사용하여 Chrome 브라우저를 관리합니다.
 */
class ChromeBrowserManager {
    /**
     * 브라우저 초기화
     * @returns 브라우저 인스턴스
     */
    async initBrowser() {
        if (!this.browser) {
            logger_1.defaultLogger.debug(`ChromeBrowserManager 초기화...`);
            // Puppeteer 동적 임포트 (필요할 때만 로드)
            const puppeteer = await Promise.resolve().then(() => __importStar(require('puppeteer')));
            this.browser = await puppeteer.launch({
                headless: config_1.default.BROWSER.HEADLESS ? 'new' : false,
                ignoreHTTPSErrors: true,
                defaultViewport: null,
                ignoreDefaultArgs: ['--enable-automation'],
                args: config_1.default.BROWSER.LAUNCH_ARGS,
                timeout: 10000, // 10 seconds
                protocolTimeout: 20000, // 20 seconds
            });
            // 브라우저 PID 저장
            this.browserPID = this.browser.process() ? this.browser.process().pid : null;
            if (this.browserPID) {
                logger_1.defaultLogger.debug(`브라우저 프로세스 ID: ${this.browserPID}`);
            }
            // 프로세스 종료 신호 처리
            const processExit = async () => {
                logger_1.defaultLogger.debug('프로세스 종료 감지, 브라우저 정리 중...');
                await this.closeBrowser();
                process.exit(0);
            };
            // 프로세스 종료 이벤트 리스너 등록
            process.once('SIGINT', processExit);
            process.once('SIGTERM', processExit);
        }
        return this.browser;
    }
    /**
     * 브라우저 종료
     */
    async closeBrowser() {
        if (this.browser) {
            logger_1.defaultLogger.debug('브라우저 정리 중...');
            try {
                // 모든 페이지 닫기 시도
                const pages = await this.browser.pages();
                await Promise.all(pages.map((page) => {
                    try {
                        return page.close();
                    }
                    catch (e) {
                        return Promise.resolve();
                    }
                }));
                // 브라우저 닫기
                await this.browser.close();
                this.browser = null;
                logger_1.defaultLogger.debug('브라우저가 정상적으로 종료되었습니다.');
            }
            catch (err) {
                logger_1.defaultLogger.error('브라우저 종료 중 오류:', err);
            }
            finally {
                // Google Chrome for Testing 프로세스 강제 종료
                this.killChromeProcesses();
            }
        }
    }
    /**
     * Chrome 프로세스 강제 종료
     */
    killChromeProcesses() {
        try {
            logger_1.defaultLogger.debug('남은 Chrome 프로세스 정리 중...');
            // OS별로 다른 명령어 실행
            if (process.platform === 'darwin') {
                // macOS
                (0, child_process_1.execSync)('pkill -f "Google Chrome for Testing"');
                logger_1.defaultLogger.debug('Google Chrome for Testing 프로세스가 정리되었습니다.');
            }
            else if (process.platform === 'linux') {
                // Linux
                (0, child_process_1.execSync)('pkill -f "chrome-for-testing"');
                (0, child_process_1.execSync)('pkill -f "chrome-test"');
            }
            else if (process.platform === 'win32') {
                // Windows
                (0, child_process_1.execSync)('taskkill /F /IM "chrome.exe" /FI "WINDOWTITLE eq *Chrome for Testing*"');
            }
        }
        catch (error) {
            // 이미 죽어있거나 다른 이유로 실패할 수 있음 - 무시
            logger_1.defaultLogger.debug('Chrome 프로세스 종료 완료 또는 종료할 프로세스가 없음');
        }
    }
    /**
     * 오류 발생 시 스크린샷 저장
     * @param page 페이지 객체
     * @param url 대상 URL
     * @returns 저장된 스크린샷 경로 또는 null
     */
    async saveErrorScreenshot(page, url) {
        if (!page) {
            logger_1.defaultLogger.debug('페이지 객체가 없어 스크린샷을 저장할 수 없습니다.');
            return null;
        }
        try {
            // 스크린샷 저장 경로 생성
            const screenshotsDir = path.join(config_1.default.PATHS.ERROR_SCREENSHOTS_DIR);
            // 디렉토리가 없으면 생성
            await fs.promises.mkdir(screenshotsDir, { recursive: true });
            // 파일명에 사용할 수 있는 URL 문자열 생성 (잘못된 문자 제거)
            const sanitizedUrl = url
                .replace(/^https?:\/\//, '')
                .replace(/[^a-zA-Z0-9]/g, '_')
                .substring(0, 100); // URL이 너무 길지 않도록 제한
            // 타임스탬프 추가
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const fileName = `${sanitizedUrl}_${timestamp}.png`;
            const filePath = path.join(screenshotsDir, fileName);
            // 스크린샷 저장
            await page.screenshot({
                path: filePath,
                fullPage: true // 전체 페이지 캡처
            });
            logger_1.defaultLogger.debug(`에러 스크린샷 저장됨: ${filePath}`);
            return filePath;
        }
        catch (screenshotError) {
            logger_1.defaultLogger.error('스크린샷 저장 중 오류:', screenshotError);
            return null;
        }
    }
}
exports.ChromeBrowserManager = ChromeBrowserManager;
//# sourceMappingURL=ChromeBrowserManager.js.map