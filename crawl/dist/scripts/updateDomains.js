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
/**
 * 모든 VisitResult 문서의 도메인 필드를 suburl_list 내 URL을 기준으로 업데이트하는 스크립트
 */
require('module-alias/register');
var _a = require('@models/visitResult'), VisitResult = _a.VisitResult, extractDomain = _a.extractDomain;
var mongoose = require('mongoose');
var mongoService = require('@database/mongodb-service').mongoService;
var logger = require('@utils/logger').defaultLogger;
// 업데이트 진행 상황 추적을 위한 변수
var processedDocuments = 0;
var updatedDocuments = 0;
var processedSubUrls = 0;
var updatedSubUrls = 0;
var skippedDocuments = 0;
var errorDocuments = 0;
/**
 * VisitResult 문서의 도메인 필드를 업데이트하는 함수
 * suburl_list 내 URL을 기준으로 도메인을 추출하고 저장합니다.
 */
function updateVisitResultDomains() {
    return __awaiter(this, void 0, void 0, function () {
        var totalDocuments, batchSize, processed, visitResults, _i, visitResults_1, visitResult, documentUpdated, domainCounts, subUrlsUpdated, _a, _b, subUrl, extractedDomain, mostFrequentDomain, highestCount, _c, _d, _e, domain, count, docError_1, error_1;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 14, , 15]);
                    logger.info('VisitResult 문서의 도메인 업데이트 시작...');
                    return [4 /*yield*/, VisitResult.countDocuments()];
                case 1:
                    totalDocuments = _f.sent();
                    logger.info("\uCD1D ".concat(totalDocuments, "\uAC1C\uC758 VisitResult \uBB38\uC11C\uAC00 \uC788\uC2B5\uB2C8\uB2E4."));
                    batchSize = 100;
                    processed = 0;
                    _f.label = 2;
                case 2:
                    if (!(processed < totalDocuments)) return [3 /*break*/, 13];
                    return [4 /*yield*/, VisitResult.find({})
                            .skip(processed)
                            .limit(batchSize)];
                case 3:
                    visitResults = _f.sent();
                    if (visitResults.length === 0)
                        return [3 /*break*/, 13];
                    _i = 0, visitResults_1 = visitResults;
                    _f.label = 4;
                case 4:
                    if (!(_i < visitResults_1.length)) return [3 /*break*/, 12];
                    visitResult = visitResults_1[_i];
                    _f.label = 5;
                case 5:
                    _f.trys.push([5, 9, , 10]);
                    processedDocuments++;
                    documentUpdated = false;
                    // suburl_list 배열의 각 항목 처리 및 문서 도메인 결정
                    if (visitResult.suburl_list && visitResult.suburl_list.length > 0) {
                        domainCounts = {};
                        subUrlsUpdated = false;
                        // 1단계: 모든 subUrl의 도메인 추출 및 카운트
                        for (_a = 0, _b = visitResult.suburl_list; _a < _b.length; _a++) {
                            subUrl = _b[_a];
                            processedSubUrls++;
                            if (subUrl.url) {
                                extractedDomain = extractDomain(subUrl.url);
                                if (extractedDomain) {
                                    // 도메인 카운트 증가
                                    if (!domainCounts[extractedDomain]) {
                                        domainCounts[extractedDomain] = 0;
                                    }
                                    domainCounts[extractedDomain]++;
                                    // subUrl 항목의 도메인 필드 업데이트
                                    if (subUrl.domain !== extractedDomain) {
                                        subUrl.domain = extractedDomain;
                                        updatedSubUrls++;
                                        subUrlsUpdated = true;
                                    }
                                }
                            }
                        }
                        // 2단계: 가장 많이 등장한 도메인을 문서의 도메인으로 설정
                        if (Object.keys(domainCounts).length > 0) {
                            mostFrequentDomain = null;
                            highestCount = 0;
                            for (_c = 0, _d = Object.entries(domainCounts); _c < _d.length; _c++) {
                                _e = _d[_c], domain = _e[0], count = _e[1];
                                if (count > highestCount) {
                                    highestCount = count;
                                    mostFrequentDomain = domain;
                                }
                            }
                            // 문서의 도메인 업데이트
                            if (mostFrequentDomain && visitResult.domain !== mostFrequentDomain) {
                                logger.debug("\uBB38\uC11C ID ".concat(visitResult._id, "\uC758 \uB3C4\uBA54\uC778 \uC5C5\uB370\uC774\uD2B8: ").concat(visitResult.domain || '없음', " -> ").concat(mostFrequentDomain));
                                visitResult.domain = mostFrequentDomain;
                                documentUpdated = true;
                            }
                        }
                        // suburl_list가 수정됐음을 표시
                        if (subUrlsUpdated) {
                            visitResult.markModified('suburl_list');
                            documentUpdated = true;
                        }
                    }
                    if (!documentUpdated) return [3 /*break*/, 7];
                    visitResult.updated_at = new Date();
                    return [4 /*yield*/, visitResult.save()];
                case 6:
                    _f.sent();
                    updatedDocuments++;
                    logger.debug("\uBB38\uC11C ID ".concat(visitResult._id, " \uC5C5\uB370\uC774\uD2B8 \uC644\uB8CC"));
                    return [3 /*break*/, 8];
                case 7:
                    skippedDocuments++;
                    _f.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    docError_1 = _f.sent();
                    errorDocuments++;
                    logger.error("\uBB38\uC11C ID ".concat(visitResult._id, " \uCC98\uB9AC \uC911 \uC624\uB958:"), docError_1);
                    return [3 /*break*/, 10];
                case 10:
                    // 진행 상황 로깅 (100개마다)
                    if (processedDocuments % 100 === 0) {
                        logger.info("\uC9C4\uD589 \uC0C1\uD669: ".concat(processedDocuments, "/").concat(totalDocuments, " \uBB38\uC11C \uCC98\uB9AC (").concat(Math.round(processedDocuments / totalDocuments * 100), "%)"));
                        logProgress();
                    }
                    _f.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 4];
                case 12:
                    processed += visitResults.length;
                    return [3 /*break*/, 2];
                case 13:
                    logger.info('VisitResult 문서의 도메인 업데이트 완료!');
                    logProgress();
                    return [3 /*break*/, 15];
                case 14:
                    error_1 = _f.sent();
                    logger.error('도메인 업데이트 처리 중 오류 발생:', error_1);
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
/**
 * 진행 상황 로깅
 */
function logProgress() {
    logger.info("\n\uCC98\uB9AC \uD1B5\uACC4:\n- \uCC98\uB9AC\uB41C \uBB38\uC11C: ".concat(processedDocuments, "\n- \uC5C5\uB370\uC774\uD2B8\uB41C \uBB38\uC11C: ").concat(updatedDocuments, "\n- \uCC98\uB9AC\uB41C SubUrl \uD56D\uBAA9: ").concat(processedSubUrls, "\n- \uC5C5\uB370\uC774\uD2B8\uB41C SubUrl \uD56D\uBAA9: ").concat(updatedSubUrls, "\n- \uAC74\uB108\uB6F4 \uBB38\uC11C (\uBCC0\uACBD \uC5C6\uC74C): ").concat(skippedDocuments, "\n- \uC624\uB958 \uBC1C\uC0DD \uBB38\uC11C: ").concat(errorDocuments, "\n  "));
}
/**
 * 메인 함수
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 6]);
                    logger.info('도메인 업데이트 작업 시작...');
                    // 데이터베이스 연결
                    return [4 /*yield*/, mongoService.connect()];
                case 1:
                    // 데이터베이스 연결
                    _a.sent();
                    logger.info('MongoDB에 연결되었습니다.');
                    // VisitResult 문서 업데이트
                    return [4 /*yield*/, updateVisitResultDomains()];
                case 2:
                    // VisitResult 문서 업데이트
                    _a.sent();
                    logger.info('모든 도메인 업데이트 작업이 완료되었습니다!');
                    return [3 /*break*/, 6];
                case 3:
                    error_2 = _a.sent();
                    logger.error('도메인 업데이트 작업 중 오류 발생:', error_2);
                    return [3 /*break*/, 6];
                case 4: 
                // 데이터베이스 연결 종료
                return [4 /*yield*/, mongoose.connection.close()];
                case 5:
                    // 데이터베이스 연결 종료
                    _a.sent();
                    logger.info('MongoDB 연결을 종료했습니다.');
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// 스크립트 실행
main().catch(function (err) {
    logger.error('스크립트 실행 중 처리되지 않은 오류:', err);
    process.exit(1);
});
