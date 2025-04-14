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
require('module-alias/register');
var VisitResult = require('@models/visitResult').VisitResult;
var mongoService = require('@database/mongodb-service').mongoService;
var logger = require('@utils/logger').defaultLogger;
/**
 * 특정 도메인의 모든 URL의 visited 상태를 false로 재설정합니다.
 * @param {string} domainName - 재설정할 도메인 이름 (예: 'example.com')
 * @returns {Promise<{success: boolean, count: number, message: string}>} 작업 결과
 */
function resetVisitedStatusForDomain(domainName) {
    return __awaiter(this, void 0, void 0, function () {
        var domainDoc, resetCount_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, 7, 8]);
                    // MongoDB 연결
                    return [4 /*yield*/, mongoService.connect()];
                case 1:
                    // MongoDB 연결
                    _a.sent();
                    return [4 /*yield*/, VisitResult.findOne({ domain: domainName })];
                case 2:
                    domainDoc = _a.sent();
                    if (!domainDoc) {
                        return [2 /*return*/, {
                                success: false,
                                count: 0,
                                message: "\uB3C4\uBA54\uC778 '".concat(domainName, "'\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.")
                            }];
                    }
                    resetCount_1 = 0;
                    if (!(domainDoc.suburl_list && domainDoc.suburl_list.length > 0)) return [3 /*break*/, 4];
                    // 각 URL 항목을 순회하며 visited를 false로 변경
                    domainDoc.suburl_list.forEach(function (urlItem) {
                        if (urlItem.visited === true) {
                            urlItem.visited = false;
                            // 방문 시간 정보도 필요하다면 재설정
                            urlItem.visitedAt = null;
                            resetCount_1++;
                        }
                    });
                    // 변경사항 저장
                    domainDoc.updated_at = new Date();
                    return [4 /*yield*/, domainDoc.save()];
                case 3:
                    _a.sent();
                    logger.info("\uB3C4\uBA54\uC778 '".concat(domainName, "'\uC758 ").concat(resetCount_1, "\uAC1C URL \uBC29\uBB38 \uC0C1\uD0DC\uAC00 \uC7AC\uC124\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4."));
                    return [2 /*return*/, {
                            success: true,
                            count: resetCount_1,
                            message: "\uB3C4\uBA54\uC778 '".concat(domainName, "'\uC758 ").concat(resetCount_1, "\uAC1C URL \uBC29\uBB38 \uC0C1\uD0DC\uAC00 \uC7AC\uC124\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.")
                        }];
                case 4: return [2 /*return*/, {
                        success: true,
                        count: 0,
                        message: "\uB3C4\uBA54\uC778 '".concat(domainName, "'\uC5D0 \uC7AC\uC124\uC815\uD560 URL\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.")
                    }];
                case 5: return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    logger.error("\uB3C4\uBA54\uC778 '".concat(domainName, "'\uC758 \uBC29\uBB38 \uC0C1\uD0DC \uC7AC\uC124\uC815 \uC911 \uC624\uB958 \uBC1C\uC0DD:"), error_1);
                    return [2 /*return*/, {
                            success: false,
                            count: 0,
                            message: "\uC624\uB958 \uBC1C\uC0DD: ".concat(error_1.message)
                        }];
                case 7: return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// 스크립트를 직접 실행할 경우 사용하는 코드
if (require.main === module) {
    // 명령줄 인수에서 도메인 이름 가져오기
    var domainName = process.argv[2];
    if (!domainName) {
        console.error('사용법: node resetVisitedStatus.js <도메인명>');
        process.exit(1);
    }
    // 실행
    resetVisitedStatusForDomain(domainName)
        .then(function (result) {
        console.log(result.message);
        process.exit(result.success ? 0 : 1);
    })
        .catch(function (err) {
        console.error('실행 중 오류 발생:', err);
        process.exit(1);
    });
}
module.exports = { resetVisitedStatusForDomain: resetVisitedStatusForDomain };
