import regions from '../../static/regions.json';
import { GeminiParser } from '@parser/GeminiParser';
import { defaultLogger as logger } from '../utils/logger';

export const OTHER_REGION_ID = 282
export const OTHER_COUNTY_ID = 281

// const parser = new GeminiParser();
export const cdToRegionMap = createCdToRegionMap(regions);


// 입력 JSON 데이터의 타입 정의
export interface Region {
  id: number;
  cd: string;
  sido: string;
  sigungu: string | null;
}

/**
 * JSON 리스트를 CD를 키로 하는 해시맵으로 변환하는 함수
 * @param regions 지역 정보가 담긴 JSON 배열
 * @returns CD를 키로 하는 해시맵
 */
function createCdToRegionMap(regions: Region[]): Record<string, Region> {
  // CD를 키로 하는 해시맵 초기화
  const cdMap: Record<string, Region> = {};

  // 배열을 순회하며 각 항목을 해시맵에 추가
  regions.forEach(region => {
    // CD를 키로 사용하여 해시맵에 저장
    cdMap[region.cd] = region;
  });

  return cdMap;
}


function simplifyRegionCode(code: string): string {
  if (code.length !== 10) return code;
  return code.slice(0, 5) + '00000';
}


export function cd2RegionId(code: string |number): number | undefined {
  try {
    if (typeof code === 'number') code = code.toString();
    if (code.length !== 10)  return undefined;;
    const region = cdToRegionMap[simplifyRegionCode(code)];
    if (!region)  return undefined;
    return region.id;
  }catch (error) {
    return undefined;
  }
}

export function regionText2RegionIds(input: string): number[] {


  const result: number[] = [];

  regions.forEach((region) => {
    // "울산 중구" → sido="울산", sigungu="중구" 인 지역
    const fullName = region.sigungu ? `${region.sido} ${region.sigungu}` : region.sido;

    if (input.includes(fullName)) {
      result.push(region.id);
    }

  });

  return result;

}



export async function regionText2RegionIdsAi(parser : GeminiParser ,input: string |undefined): Promise<number[]> {

  if (!input) {
    return [OTHER_REGION_ID];
  }
  const baseIds = regionText2RegionIds(input);
  logger.debug('baseIds', baseIds);
  return await parser.ParseRegionText(input, 100,3000).then(
    (results) => {
      if (!results) return [];
      const ids = results.
        filter(cd => cd.length == 10)
        .map(cd => cdToRegionMap[simplifyRegionCode(cd)]?.id)
        .filter(id => id !== undefined);
      return [...new Set([...ids, ...baseIds])]
    }
  ).catch(
    (error) => {
      logger.error('Region Text 로 변환하는데 실패하였습니다.')
      throw error
    }
  ).then(
    (results) => {
      if (results.length == 0) {
        logger.error('Region Text 로 변환한 결과가 없습니다.')
        return [OTHER_REGION_ID]
      }
      return results
    }
  )
  .catch(
    (error) => {
      logger.error('Region Cd를 id로 변환하는데 실패하였습니다.')
      throw error
    }
  )

}
