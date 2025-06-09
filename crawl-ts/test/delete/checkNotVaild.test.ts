import { checkUrl  } from '../../src/scripts/deleteAllNotVaildUrl';
import { MysqlRecruitInfoRepository } from '../../src/database/MysqlRecruitInfoRepository';
describe('deleteAllNotVaildUrl', () => {


  const mysqlRecruitInfoRepository = new MysqlRecruitInfoRepository();


  test('should return false for popup url', async () => {
    const invalidUrls = 'https://recruit.navercorp.com/rcrt/view.do?annoId=30003209&sw=&subJobCdArr=1010001%2C1010002%2C1010003%2C1010004%2C1010005%2C1010006%2C1010007%2C1010008%2C1010009%2C1010020%2C1020001%2C1030001%2C1030002%2C1040001%2C1040002%2C1040003%2C1050001%2C1050002%2C1060001&sysCompanyCdArr=&empTypeCdArr=&entTypeCdArr=&workAreaCdArr='

    const result = await checkUrl(invalidUrls);
    expect(result.success).toBe(false);

  })


})