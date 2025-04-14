"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var mongoose = require('mongoose');
var Table = require('cli-table3');
var Schema = mongoose.Schema;
// URL 항목 서브스키마 (suburl_list 배열의 항목)
var SubUrlSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    visited: {
        type: Boolean,
        default: false
    },
    visitedAt: Date,
    discoveredAt: Date,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    isRecruit: Boolean,
    isRecruit_claude: Boolean,
    success: Boolean,
    error: String,
    errors: [{
            type: { type: String },
            message: String,
            stack: String,
            url: String
        }],
    finalUrl: String,
    text: String,
    title: String,
    meta: Schema.Types.Mixed,
    crawlStats: {
        blocked_by_robots: Number,
        allowed_after_robots: Number,
        total: Number,
        href: Number,
        onclick: Number
    },
    domain: String,
    redirected: Boolean,
    crawledUrls: { type: [String], default: [] } //
});
/**
 * SubUrl 항목의 상세 정보를 테이블 형식으로 로깅
 * @param {Object} logger - 로깅에 사용할 로거 객체
 * @returns {void}
 */
SubUrlSchema.methods.logSummary = function (logger) {
    var _this = this;
    try {
        if (!logger) {
            console.warn('로거가 제공되지 않았습니다. 기본 콘솔을 사용합니다.');
            logger = console;
        }
        // URL 기본 정보
        logger.info("\nURL \uD56D\uBAA9 \uC694\uC57D \uC815\uBCF4:");
        // const basicInfo = {
        //   URL: this.url,
        //   도메인: this.domain || extractDomain(this.url),
        //   제목: this.title || '제목 없음',
        //   내용: this.text || '내용 없음',
        //   방문여부: this.visited ? '방문함' : '방문하지 않음',
        //   성공여부: this.success ? '성공' : this.visited ? '실패' : '미방문',
        //   리다이렉트: this.redirected ? `${this.url} → ${this.finalUrl}` : '없음',
        //   방문시간: this.visitedAt ? new Date(this.visitedAt).toLocaleString() : '없음',
        //   발견시간: this.discoveredAt ? new Date(this.discoveredAt).toLocaleString() : new Date(this.created_at).toLocaleString(),
        //   생성시간: new Date(this.created_at).toLocaleString(),
        //   수정시간: new Date(this.updated_at).toLocaleString()
        // };
        // console.table(basicInfo);
        // 커스텀 테이블 생성
        var table = new Table({
            head: ['항목', '값'],
            colWidths: [15, 65], // 열 너비 고정
            wordWrap: true // 긴 텍스트 자동 줄바꿈
        });
        // 데이터 추가
        table.push(['URL', this.url], ['도메인', this.domain || extractDomain(this.url)], ['제목', this.title || '제목 없음'], ['방문여부', this.visited ? '방문함' : '방문하지 않음'], ['성공여부', this.success ? '성공' : this.visited ? '실패' : '미방문'], ['리다이렉트', this.redirected ? "".concat(this.url, " \u2192 ").concat(this.finalUrl) : '없음'], ['방문시간', this.visitedAt ? new Date(this.visitedAt).toLocaleString() : '없음'], ['발견시간', this.discoveredAt ? new Date(this.discoveredAt).toLocaleString() : new Date(this.created_at).toLocaleString()], ['생성시간', new Date(this.created_at).toLocaleString()], ['수정시간', new Date(this.updated_at).toLocaleString()]);
        // 내용은 별도 테이블로 처리
        if (this.text) {
            var contentPreview = this.text.length > 200
                ? this.text.substring(0, 197) + '...'
                : this.text;
            table.push(['내용 미리보기', contentPreview]);
            table.push(['내용 길이', "".concat(this.text.length, "\uC790")]);
        }
        // 테이블 출력
        logger.debug("\nURL \uD56D\uBAA9 \uC694\uC57D \uC815\uBCF4:");
        logger.debug('\n' + table.toString());
        // 크롤링 통계가 있으면 표시
        if (this.crawlStats) {
            var crawlStats = {
                '총 링크 수': this.crawlStats.total || 0,
                'href 링크 수': this.crawlStats.href || 0,
                'onclick 링크 수': this.crawlStats.onclick || 0
            };
            logger.info('크롤링 통계:');
            console.table(crawlStats);
        }
        // 메타 정보가 있으면 표시 (최상위 속성만)
        if (this.meta && typeof this.meta === 'object') {
            var metaInfo_1 = {};
            // 중첩된 객체는 [Object]로 표시, 배열은 [Array(길이)]로 표시
            Object.keys(this.meta).forEach(function (key) {
                var value = _this.meta[key];
                if (value === null || value === undefined) {
                    metaInfo_1[key] = 'null';
                }
                else if (typeof value === 'object') {
                    if (Array.isArray(value)) {
                        metaInfo_1[key] = "[Array(".concat(value.length, ")]");
                    }
                    else {
                        metaInfo_1[key] = '[Object]';
                    }
                }
                else {
                    // 문자열이 너무 길면 잘라서 표시
                    var strValue = value.toString();
                    metaInfo_1[key] = strValue.length > 50 ? strValue.substring(0, 47) + '...' : strValue;
                }
            });
            if (Object.keys(metaInfo_1).length > 0) {
                logger.info('메타 정보:');
                console.table(metaInfo_1);
            }
        }
        // 오류 정보가 있으면 표시
        if (this.error) {
            logger.error('오류 정보:', this.error);
        }
        // 텍스트 내용이 있으면 일부 표시
        if (this.text) {
            var textLength = this.text.length;
            var previewText = textLength > 200 ? this.text.substring(0, 197) + '...' : this.text;
            logger.info("\uD14D\uC2A4\uD2B8 \uB0B4\uC6A9 (".concat(textLength, " \uAE00\uC790):"));
            logger.info(previewText);
        }
    }
    catch (error) {
        if (logger) {
            logger.error('URL 항목 요약 정보 생성 중 오류 발생:', error);
        }
        else {
            console.error('URL 항목 요약 정보 생성 중 오류 발생:', error);
        }
    }
};
// 메인 VisitResult 스키마 (도메인 기반)
var VisitResultSchema = new Schema({
    domain: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    suburl_list: [SubUrlSchema], // 주의: 필드명이 suburl_list임 (suburlList가 아님)
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    url: String
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    collection: 'domains'
});
// URL로 검색하는 static 메서드 추가
VisitResultSchema.statics.findByUrl = function (url) {
    return __awaiter(this, void 0, void 0, function () {
        var domain, result, urlEntry;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    domain = extractDomain(url);
                    return [4 /*yield*/, this.findOne({ domain: domain })];
                case 1:
                    result = _a.sent();
                    if (!result || !result.suburl_list)
                        return [2 /*return*/, null];
                    urlEntry = result.suburl_list.find(function (item) { return item.url === url; });
                    if (!urlEntry)
                        return [2 /*return*/, null];
                    // URL 항목을 포함한 전체 결과 반환
                    return [2 /*return*/, {
                            domain: result.domain,
                            urlEntry: urlEntry
                        }];
            }
        });
    });
};
// 방문하지 않은 URL 찾기
VisitResultSchema.statics.findUnvisitedUrl = function (domain) {
    return __awaiter(this, void 0, void 0, function () {
        var result, unvisitedEntry, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, this.findOne({ domain: domain })];
                case 1:
                    result = _a.sent();
                    if (!result || !result.suburl_list)
                        return [2 /*return*/, null];
                    unvisitedEntry = result.suburl_list.find(function (item) { return !item.visited; });
                    if (!unvisitedEntry)
                        return [2 /*return*/, null];
                    return [2 /*return*/, {
                            url: unvisitedEntry.url,
                            domain: domain
                        }];
                case 2:
                    error_1 = _a.sent();
                    console.error("\uB3C4\uBA54\uC778 ".concat(domain, "\uC5D0\uC11C \uBC29\uBB38\uD558\uC9C0 \uC54A\uC740 URL \uCC3E\uAE30 \uC624\uB958:"), error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
};
// 도메인 통계 가져오기
VisitResultSchema.statics.getDomainStatsEfficient = function (logger) {
    return __awaiter(this, void 0, void 0, function () {
        var domains, domainStats, summary, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, this.find({}).lean()];
                case 1:
                    domains = _a.sent();
                    domainStats = domains.map(function (domain) {
                        // 각 도메인의 URL 통계 계산
                        var total = domain.suburl_list ? domain.suburl_list.length : 0;
                        var visited = domain.suburl_list ? domain.suburl_list.filter(function (url) { return url.visited; }).length : 0;
                        var pending = total - visited;
                        return {
                            domain: domain.domain,
                            total: total,
                            visited: visited,
                            pending: pending
                        };
                    });
                    summary = {
                        totalDomains: domainStats.length,
                        activeDomains: domainStats.filter(function (d) { return d.total > 0; }).length,
                        totalUrls: domainStats.reduce(function (sum, d) { return sum + d.total; }, 0),
                        visitedUrls: domainStats.reduce(function (sum, d) { return sum + d.visited; }, 0),
                        pendingUrls: domainStats.reduce(function (sum, d) { return sum + d.pending; }, 0)
                    };
                    if (logger) {
                        logger.info("\uB3C4\uBA54\uC778 \uD1B5\uACC4: \uCD1D ".concat(summary.totalDomains, "\uAC1C \uB3C4\uBA54\uC778, ").concat(summary.totalUrls, "\uAC1C URL (\uBC29\uBB38: ").concat(summary.visitedUrls, ", \uB300\uAE30: ").concat(summary.pendingUrls, ")"));
                    }
                    return [2 /*return*/, { domains: domainStats, summary: summary }];
                case 2:
                    error_2 = _a.sent();
                    if (logger) {
                        logger.error('도메인 통계 계산 오류:', error_2);
                    }
                    else {
                        console.error('도메인 통계 계산 오류:', error_2);
                    }
                    return [2 /*return*/, { domains: [], summary: { totalDomains: 0, activeDomains: 0, totalUrls: 0, visitedUrls: 0, pendingUrls: 0 } }];
                case 3: return [2 /*return*/];
            }
        });
    });
};
// 도메인 추출 헬퍼 함수
function extractDomain(url) {
    try {
        if (!url)
            return null;
        var hostname = new URL(url).hostname;
        return hostname;
    }
    catch (e) {
        console.error("URL\uC5D0\uC11C \uB3C4\uBA54\uC778 \uCD94\uCD9C \uC2E4\uD328: ".concat(url), e);
        return null;
    }
}
var SubUrl = mongoose.model('SubUrl', SubUrlSchema);
var VisitResult = mongoose.model('VisitResult', VisitResultSchema);
module.exports = {
    VisitResult: VisitResult,
    VisitResultSchema: VisitResultSchema,
    SubUrl: SubUrl,
    SubUrlSchema: SubUrlSchema,
    extractDomain: extractDomain
};
