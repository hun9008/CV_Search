"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseManager = void 0;
/**
 * 채용공고 파싱 및 필터링을 관리하는 클래스
 */
class ParseManager {
    /**
     * ParseManager 생성자
     * @param options 옵션 객체
     */
    constructor(options = {}) {
        this.batchSize = options.batchSize || 10;
        this.maxRetries = options.maxRetries || 3;
        this.concurrency = options.concurrency || 2;
        this.delayBetweenRequests = options.delayBetweenRequests || 1000;
        this.defaultParser = options.defaultParser;
        this.isRunning = false;
        this.isCancelled = false;
        this.stats = this.resetStats();
    }
    /**
     * 통계 초기화
     * @private
     */
    resetStats() {
        return {
            processed: 0,
            isRecruit: 0,
            notRecruit: 0,
            failed: 0,
            retried: 0,
            saved: 0,
            startTime: Date.now()
        };
    }
    /**
     * 파서 지정
     * @param parser 파서 인스턴스
     */
    setParser(parser) {
        this.defaultParser = parser;
    }
    /**
     * URL 콘텐츠 파싱
     * @param urlData URL 데이터
     * @param parser 사용할 파서 (없으면 기본 파서 사용)
     */
    async parseUrlContent(urlData, parser) {
        const activeParser = parser || this.defaultParser;
        if (!activeParser) {
            throw new Error('파서가 지정되지 않았습니다.');
        }
        const content = `
    Title: ${urlData.title || ''}

    Content:
    ${urlData.text?.substring(0, 30000) || ''}
    `;
        return await activeParser.parseContent(content);
    }
    /**
     * 대기 함수 (요청 간 지연 시간)
     * @param ms 대기 시간(ms)
     */
    async wait(ms = this.delayBetweenRequests) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 실행 중인 배치 작업 취소
     */
    cancel() {
        if (!this.isRunning) {
            return false;
        }
        console.debug('배치 처리 작업 취소 중...');
        this.isCancelled = true;
        return true;
    }
    /**
     * 현재 상태 정보 반환
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            stats: { ...this.stats },
            config: {
                batchSize: this.batchSize,
                maxRetries: this.maxRetries,
                delayBetweenRequests: this.delayBetweenRequests,
                concurrency: this.concurrency
            }
        };
    }
    /**
     * 채용 정보를 데이터베이스에 저장하는 메서드의 인터페이스
     * 이 메서드는 실제 구현에서 오버라이드해야 합니다.
     */
    async saveRecruitInfo(recruitInfo) {
        throw new Error('이 메서드는 구현되지 않았습니다. 상속 클래스에서 구현해주세요.');
    }
    /**
     * URL 상태를 업데이트하는 메서드의 인터페이스
     * 이 메서드는 실제 구현에서 오버라이드해야 합니다.
     */
    async updateUrlStatus(url, isRecruit) {
        throw new Error('이 메서드는 구현되지 않았습니다. 상속 클래스에서 구현해주세요.');
    }
    /**
     * 미분류 URL 목록을 가져오는 메서드의 인터페이스
     * 이 메서드는 실제 구현에서 오버라이드해야 합니다.
     */
    async fetchUnclassifiedUrls(limit = this.batchSize) {
        throw new Error('이 메서드는 구현되지 않았습니다. 상속 클래스에서 구현해주세요.');
    }
}
exports.ParseManager = ParseManager;
//# sourceMappingURL=ParseManager.js.map