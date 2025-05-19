import 'dotenv/config'
import {  regionText2RegionIdsAi } from '../../src/trasnform/Transform'; // 경로는
import { GeminiParser } from '../../src/parser/GeminiParser'; // GeminiParser 모듈

describe('regionText2RegionIds 테스트', () => {
  const parser = new GeminiParser();

  test('정확한 한글 입력: 서울 → [1]', async () => {
    const result = await regionText2RegionIdsAi(parser,'서울');
    expect(result).toContain(1);
  });

  test('정확한 한글 입력: 서울 강남구  → [1]', async () => {
    const result = await regionText2RegionIdsAi(parser,'서울특별시 강남구');
    expect(result).toContain(1);
    expect(result.length).toBeLessThan(3);
  });


  test('정확한 한글 입력: 서울 강동구  → [1]', async () => {
    const result = await regionText2RegionIdsAi(parser,'서울특별시 강동구');
    expect(result).toContain(1);
    expect(result.length).toBeLessThan(3);
  });

  test('정확한 한글 입력: 경기 → [84]', async () => {
    const result = await regionText2RegionIdsAi(parser,'경기');
    expect(result).toContain(84);
  });

  test('영문 입력: seoul → [1]',async() => {
    const result = await regionText2RegionIdsAi(parser,'seoul');
    expect(result).toContain(1);
  });

   test('영문 입력: bundang → [93]',async() => {
    const result = await regionText2RegionIdsAi(parser,'bundang');
    expect(result).toContain(93);
  });

  test('한글 멀티 기준: 서울 종로구 , 서울 중구  -> [ 2,3 ]',async() => {
    const result = await regionText2RegionIdsAi(parser,'서울 종로구 , 서울 중구');
    expect(result).toContain(2);
    expect(result).toContain(3);
  });

  test('해외 지역: 베이징 ->[] ',async() => {
    const result = await regionText2RegionIdsAi(parser,'베이징, baejing');
    expect(result.length).toContain(282);
  });


  test('판교 경기 성남시 분당구로 분류: 판교 ->[93] ',async() => {
    const result = await regionText2RegionIdsAi(parser,'판교');
    expect(result).toContain(93);
  });

  test('복잡한 지역 : 신세계백화점 대구점  ->[44]',async() => {
    const result = await regionText2RegionIdsAi(parser,'신세계백화점 대구점');
    expect(result).toContain(44);
  });

});