import 'dotenv/config'; // dotenv 설정
import fs from 'fs';
import path from 'path';
import { defaultLogger as logger } from '../utils/logger';

// regionText2RegionIdsAi 함수가 비동기라고 가정합니다.
import { regionText2RegionIds } from '../trasnform/Transform';

// 한국어 판단 함수 (간단한 정규표현식 사용)
function isKorean(text: string): boolean {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
}
interface RegionText{
  region_text: string;
}
// region_text 배열을 파일에서 불러온다고 가정
const regionTextsPath = path.join(__dirname, '../../static/region_text.json'); // 예: ["서울 강남구", "New York", ...]
const regionTexts: RegionText[] = JSON.parse(fs.readFileSync(regionTextsPath, 'utf-8'));

async function processRegionTexts() {
  const results: {
    region_text: string;
    region_ids: number[];
    lang: 'ko' | 'en';
  }[] = [];

  let koreanCount = 0;
  let englishCount = 0;
  let koreanWithRegionIds = 0;

  for (const data of regionTexts) {
    // 언어 감지
    const region_text = data.region_text
    const lang = isKorean(region_text) ? 'ko' : 'en';
    if (lang === 'ko') koreanCount++;
    else englishCount++;

    logger.debug(`[regionTranform] ${region_text} 파싱중...`);
    const regionIds = await regionText2RegionIds(region_text);
    if (lang === 'ko' && regionIds.length > 0) {
      koreanWithRegionIds++;
    }

    results.push({
      region_text: region_text,
      region_ids: regionIds,
      lang,
    });
  }

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

  const outputPath = path.join(__dirname, 'region_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log('변환 완료:', summary);
}

processRegionTexts().catch(console.error);