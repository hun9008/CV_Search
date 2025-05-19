"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const logger_1 = require("../../src/utils/logger");
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const MysqlRecruitInfoRepository_1 = require("../database/MysqlRecruitInfoRepository");
const mysqlRecruitInfoRepository = new MysqlRecruitInfoRepository_1.MysqlRecruitInfoRepository();
const keywordsToDetectFailure = [
    '공고가 마감되었습니다',
    '존재하지 않는',
    '페이지를 찾을 수 없습니다',
    'This job is no longer available',
    '채용이 마감',
    '공고가 마감',
    '채용이 종료',
];
async function checkUrl(url) {
    try {
        const response = await axios_1.default.get(url);
        const html = response.data;
        const isEmpty = !html || html.trim().length === 0;
        const containsFailureKeyword = keywordsToDetectFailure.some(keyword => html.includes(keyword));
        if (isEmpty || containsFailureKeyword) {
            console.log(`[FAIL - ${isEmpty ? 'EMPTY' : 'KEYWORD'}] ${url}`);
            return {
                status: response.status,
                success: false,
                reason: isEmpty
                    ? 'EMPTY_BODY'
                    : 'CLOSED_OR_INVALID_CONTENT',
            };
        }
        else {
            return {
                status: response.status,
                success: true,
            };
        }
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error(`[ERROR] ${url}: ${error.message}`);
            return {
                status: error.response?.status || 'UNKNOWN_ERROR',
                success: false,
                reason: 'REQUEST_ERROR',
            };
        }
        return {
            status: 'UNKNOWN_ERROR',
            success: false,
            reason: 'REQUEST_ERROR',
        };
    }
}
async function getNotVaildUrls() {
    const RecruitInfoUrls = await mysqlRecruitInfoRepository.getAllRecruitInfoUrl();
    const tasks = [];
    const results = [];
    for (const data of RecruitInfoUrls) {
        tasks.push(checkUrl(data.url)
            .then((result) => {
            results.push({
                id: data.id,
                url: data.url,
                status: result.status,
                success: result.success,
                reason: result.reason,
            });
            return true;
        })
            .catch((error) => {
            logger_1.defaultLogger.error(`URL 체크 중 오류 발생: ${data.url}`, error);
            return false;
        }));
    }
    await Promise.all(tasks);
    (0, fs_1.writeFileSync)('url-check-detailed-results.json', JSON.stringify(results, null, 2), 'utf-8');
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    console.log(`✅ 성공: ${successCount}`);
    console.log(`❌ 실패: ${failCount}`);
    return results.filter(r => r.success == false);
}
(async () => {
    await getNotVaildUrls()
        .then(async (datas) => {
        const deleteCount = datas.length;
        logger_1.defaultLogger.debug(`삭제할 URL 갯수: ${deleteCount}`);
        const tasks = [];
        for (const data of datas) {
            tasks.push(mysqlRecruitInfoRepository.deleteRecruitInfoById(data.id)
                .then(() => {
                logger_1.defaultLogger.debug(`삭제 성공: ${data.id} - ${data.url}`);
                return true;
            })
                .catch((error) => {
                logger_1.defaultLogger.debug(`삭제 실패: ${data.id} - ${data.url}`, error);
                return false;
            }));
        }
        const successCount = (await Promise.all(tasks)).filter(r => r == true).length;
        logger_1.defaultLogger.debug(`삭제한 URL 갯수: ${successCount} / ${datas.length}`);
    });
})();
//# sourceMappingURL=deleteAllNotVaildUrl.js.map