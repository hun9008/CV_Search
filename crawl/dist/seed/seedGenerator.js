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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
require('module-alias/register');
var getUrlSeed = require('./getUrlSeed');
var mongoose = require('mongoose');
var _a = require('../models/visitResult'), VisitResult = _a.VisitResult, SubUrl = _a.SubUrl, extractDomain = _a.extractDomain;
var config = require('@config/config');
var logger = require('@utils/logger').defaultLogger;
/**
 * seed URL을 수집하여 MongoDB의 VisitResult 모델에 저장
 */
function saveSeedsToMongoDB() {
    return __awaiter(this, void 0, void 0, function () {
        var totalDomainsAdded, totalUrlsAdded, domainMap, urlCount, _a, _b, _c, url, domain, existingDomain, newDomain, error_1, e_1_1, error_2;
        var _d, e_1, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    totalDomainsAdded = 0;
                    totalUrlsAdded = 0;
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 22, 23, 26]);
                    logger.info('URL seed 생성 시작...');
                    domainMap = new Map();
                    urlCount = 0;
                    _g.label = 2;
                case 2:
                    _g.trys.push([2, 15, 16, 21]);
                    _a = true, _b = __asyncValues(getUrlSeed());
                    _g.label = 3;
                case 3: return [4 /*yield*/, _b.next()];
                case 4:
                    if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 14];
                    _f = _c.value;
                    _a = false;
                    url = _f;
                    urlCount++;
                    logger.info("URL에서 도메인 추출");
                    domain = extractDomain(url);
                    logger.info("\uB3C4\uBA54\uC778 : ".concat(domain));
                    if (!domain)
                        return [3 /*break*/, 13];
                    logger.info('MongoDB에 연결 중...');
                    return [4 /*yield*/, mongoose.connect(process.env.MONGODB_ADMIN_URI, {
                            useNewUrlParser: true,
                            useUnifiedTopology: true,
                            dbName: 'crwal_db',
                        })];
                case 5:
                    _g.sent();
                    _g.label = 6;
                case 6:
                    _g.trys.push([6, 11, , 12]);
                    return [4 /*yield*/, VisitResult.findOne({ domain: domain })];
                case 7:
                    existingDomain = _g.sent();
                    if (!existingDomain) return [3 /*break*/, 8];
                    logger.info("\uB3C4\uBA54\uC778 ".concat(domain, ": \uC774\uBBF8 \uC874\uC7AC\uD558\uB294 \uB3C4\uBA54\uC778 \uAC74\uB108\uB700"));
                    return [3 /*break*/, 10];
                case 8:
                    newDomain = new VisitResult({
                        domain: domain,
                        url: url,
                        suburl_list: [new SubUrl({ url: url })],
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                    return [4 /*yield*/, newDomain.save()];
                case 9:
                    _g.sent();
                    logger.info("\uB3C4\uBA54\uC778 ".concat(domain, " URL \uCD94\uAC00\uB428 (\uC0C8 \uB3C4\uBA54\uC778)"));
                    _g.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_1 = _g.sent();
                    logger.error("\uB3C4\uBA54\uC778 ".concat(domain, " \uCC98\uB9AC \uC911 \uC624\uB958: ").concat(error_1.message));
                    logger.error(error_1.stack);
                    return [3 /*break*/, 12];
                case 12:
                    // 최종 통계 출력
                    logger.info("URL seed \uCC98\uB9AC \uC644\uB8CC: ".concat(totalDomainsAdded, "\uAC1C\uC758 \uC0C8 \uB3C4\uBA54\uC778, ").concat(totalUrlsAdded, "\uAC1C\uC758 URL \uCD94\uAC00\uB428"));
                    _g.label = 13;
                case 13:
                    _a = true;
                    return [3 /*break*/, 3];
                case 14: return [3 /*break*/, 21];
                case 15:
                    e_1_1 = _g.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 21];
                case 16:
                    _g.trys.push([16, , 19, 20]);
                    if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 18];
                    return [4 /*yield*/, _e.call(_b)];
                case 17:
                    _g.sent();
                    _g.label = 18;
                case 18: return [3 /*break*/, 20];
                case 19:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 20: return [7 /*endfinally*/];
                case 21: return [3 /*break*/, 26];
                case 22:
                    error_2 = _g.sent();
                    logger.error("URL seed \uC0DD\uC131 \uBC0F MongoDB \uC800\uC7A5 \uC911 \uC624\uB958: ".concat(error_2.message));
                    logger.error(error_2.stack);
                    return [3 /*break*/, 26];
                case 23:
                    if (!(mongoose.connection.readyState !== 0)) return [3 /*break*/, 25];
                    return [4 /*yield*/, mongoose.disconnect()];
                case 24:
                    _g.sent();
                    _g.label = 25;
                case 25: return [7 /*endfinally*/];
                case 26: return [2 /*return*/];
            }
        });
    });
}
// 스크립트 실행
if (require.main === module) {
    saveSeedsToMongoDB().catch(function (error) {
        logger.error("\uC2E4\uD589 \uC911 \uC608\uC0C1\uCE58 \uBABB\uD55C \uC624\uB958: ".concat(error.message));
        logger.error(error.stack);
        process.exit(1);
    });
}
module.exports = {
    saveSeedsToMongoDB: saveSeedsToMongoDB
};
