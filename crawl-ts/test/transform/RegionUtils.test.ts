import { cd2RegionId, regionText2RegionIds } from '../../src/trasnform/Transform';
import regions from '../../static/regions.json';

describe('Region Utility Functions', () => {
  describe('cd2RegionId', () => {
    test('should return the correct region ID for a valid 10-digit code', () => {
      const validCode = '1234500000';
      const expectedRegion = regions.find(region => region.cd === '1234500000');
      const result = cd2RegionId(validCode);
      expect(result).toBe(expectedRegion?.id);
    });

    test('should return undefined for an invalid code', () => {
      const invalidCode = 'invalid_code';
      const result = cd2RegionId(invalidCode);
      expect(result).toBeUndefined();
    });

    test('should return undefined for a code with length not equal to 10', () => {
      const shortCode = '12345';
      const result = cd2RegionId(shortCode);
      expect(result).toBeUndefined();
    });
  });

  describe('regionText2RegionIds', () => {
    test('should return correct region IDs for matching input text', () => {
      const input = '서울특별시 강남구';
      const expectedRegions = regions.filter(region => {
        const fullName = region.sigungu ? `${region.sido} ${region.sigungu}` : region.sido;
        return input.includes(fullName);
      }).map(region => region.id);

      const result = regionText2RegionIds(input);
      expect(result).toEqual(expectedRegions);
    });

    test('should return an empty array for non-matching input text', () => {
      const input = 'Nonexistent Region';
      const result = regionText2RegionIds(input);
      expect(result).toEqual([]);
    });

    test('should handle input with multiple matching regions', () => {
      const input = '서울특별시 강남구, 서울특별시 강동구';
      const expectedRegions = regions.filter(region => {
        const fullName = region.sigungu ? `${region.sido} ${region.sigungu}` : region.sido;
        return input.includes(fullName);
      }).map(region => region.id);

      const result = regionText2RegionIds(input);
      expect(result).toEqual(expectedRegions);
    });
  });
});
