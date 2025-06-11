import regions from '../../static/regions.json';


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




