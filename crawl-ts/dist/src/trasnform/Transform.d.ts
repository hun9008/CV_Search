import { GeminiParser } from '@parser/GeminiParser';
export declare const OTHER_REGION_ID = 282;
export declare const OTHER_COUNTY_ID = 281;
export declare const cdToRegionMap: Record<string, Region>;
export interface Region {
    id: number;
    cd: string;
    sido: string;
    sigungu: string | null;
}
export declare function cd2RegionId(code: string | number): number | undefined;
export declare function regionText2RegionIds(input: string): number[];
export declare function regionText2RegionIdsAi(parser: GeminiParser, input: string | undefined): Promise<number[]>;
