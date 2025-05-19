"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cdToRegionMap = exports.OTHER_COUNTY_ID = exports.OTHER_REGION_ID = void 0;
exports.cd2RegionId = cd2RegionId;
exports.regionText2RegionIds = regionText2RegionIds;
exports.regionText2RegionIdsAi = regionText2RegionIdsAi;
const regions_json_1 = __importDefault(require("../../static/regions.json"));
const logger_1 = require("../utils/logger");
exports.OTHER_REGION_ID = 282;
exports.OTHER_COUNTY_ID = 281;
// const parser = new GeminiParser();
exports.cdToRegionMap = createCdToRegionMap(regions_json_1.default);
/**
 * JSON 리스트를 CD를 키로 하는 해시맵으로 변환하는 함수
 * @param regions 지역 정보가 담긴 JSON 배열
 * @returns CD를 키로 하는 해시맵
 */
function createCdToRegionMap(regions) {
    // CD를 키로 하는 해시맵 초기화
    const cdMap = {};
    // 배열을 순회하며 각 항목을 해시맵에 추가
    regions.forEach(region => {
        // CD를 키로 사용하여 해시맵에 저장
        cdMap[region.cd] = region;
    });
    return cdMap;
}
function simplifyRegionCode(code) {
    if (code.length !== 10)
        return code;
    return code.slice(0, 5) + '00000';
}
function cd2RegionId(code) {
    try {
        if (typeof code === 'number')
            code = code.toString();
        if (code.length !== 10)
            return undefined;
        ;
        const region = exports.cdToRegionMap[simplifyRegionCode(code)];
        if (!region)
            return undefined;
        return region.id;
    }
    catch (error) {
        return undefined;
    }
}
function regionText2RegionIds(input) {
    const result = [];
    regions_json_1.default.forEach((region) => {
        // "울산 중구" → sido="울산", sigungu="중구" 인 지역
        const fullName = region.sigungu ? `${region.sido} ${region.sigungu}` : region.sido;
        if (input.includes(fullName)) {
            result.push(region.id);
        }
    });
    return result;
}
async function regionText2RegionIdsAi(parser, input) {
    if (!input) {
        return [exports.OTHER_REGION_ID];
    }
    const baseIds = regionText2RegionIds(input);
    logger_1.defaultLogger.debug('baseIds', baseIds);
    return await parser.ParseRegionText(input, 100, 3000).then((results) => {
        if (!results)
            return [];
        const ids = results.
            filter(cd => cd.length == 10)
            .map(cd => exports.cdToRegionMap[simplifyRegionCode(cd)]?.id)
            .filter(id => id !== undefined);
        return [...new Set([...ids, ...baseIds])];
    }).catch((error) => {
        logger_1.defaultLogger.error('Region Text 로 변환하는데 실패하였습니다.');
        throw error;
    }).then((results) => {
        if (results.length == 0) {
            logger_1.defaultLogger.error('Region Text 로 변환한 결과가 없습니다.');
            return [exports.OTHER_REGION_ID];
        }
        return results;
    })
        .catch((error) => {
        logger_1.defaultLogger.error('Region Cd를 id로 변환하는데 실패하였습니다.');
        throw error;
    });
}
//# sourceMappingURL=Transform.js.map