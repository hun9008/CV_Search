"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // dotenv 설정
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const GeminiParser_1 = require("../parser/GeminiParser"); // GeminiParser 모듈
// regionText2RegionIdsAi 함수가 비동기라고 가정합니다.
const Transform_1 = require("../trasnform/Transform");
// 한국어 판단 함수 (간단한 정규표현식 사용)
function isKorean(text) {
    return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
}
// region_text 배열을 파일에서 불러온다고 가정
const regionTextsPath = path_1.default.join(__dirname, '../../static/region_text.json'); // 예: ["서울 강남구", "New York", ...]
const regionTexts = JSON.parse(fs_1.default.readFileSync(regionTextsPath, 'utf-8'));
const parser = new GeminiParser_1.GeminiParser();
async function processRegionTexts() {
    const results = [];
    let koreanCount = 0;
    let englishCount = 0;
    let koreanWithRegionIds = 0;
    for (const data of regionTexts) {
        const region_text = data.region_text;
        const lang = isKorean(region_text) ? 'ko' : 'en';
        if (lang === 'ko')
            koreanCount++;
        else
            englishCount++;
        logger_1.defaultLogger.debug(`[regionTranform] ${region_text} 파싱중...`);
        await (0, Transform_1.regionText2RegionIdsAi)(parser, region_text).then((regionIds) => {
            if (lang === 'ko' && regionIds.length > 0) {
                koreanWithRegionIds++;
            }
            results.push({
                region_text: region_text,
                region_ids: regionIds,
                lang,
            });
        });
    }
    ;
    const summary = {
        total: regionTexts.length,
        korean_count: koreanCount,
        english_count: englishCount,
        korean_with_region_ids: koreanWithRegionIds,
    };
    const output = {
        summary,
        details: results,
    };
    const outputPath = path_1.default.join(__dirname, 'region_results.json');
    fs_1.default.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log('변환 완료:', summary);
}
processRegionTexts().catch(console.error);
//# sourceMappingURL=regionTest.js.map