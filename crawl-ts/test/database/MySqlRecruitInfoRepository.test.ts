import 'dotenv/config';
import { MysqlRecruitInfoRepository } from '../../src/database/MysqlRecruitInfoRepository';
describe('Mysql Repository 테스트', () => {

  let repository: MysqlRecruitInfoRepository;

  repository = new MysqlRecruitInfoRepository();
  test('job ID로 job 삭제하기', async () => {
    await repository.deleteRecruitInfoById(9999);
  }
  );

  test('job 생성하면서 region_id 생성하기', async () => {
    const recruitInfo = {
      title: 'Test Job',
      company_name: 'Test Company',
      url: 'https://example.com/job/125',
      text: 'Job description',
      job_description: 'Job description',
      job_type: '정규직/계약직',
      is_public: true,
      is_parse_success: true,
      is_it_recruit_info: true,
      is_recruit_info: true,
      region_id: [1, 2, 3], // 예시로 지역 ID 배열 추가
    };
    const createdRecruitInfo = await repository.createRecruitInfo(recruitInfo);
    console.log('Created Recruit Info:', createdRecruitInfo);
  }
  )


  test('모든 채용 보여주기 가능한 정보 URL 가져오기', async () => {
    const recruitInfoUrls = await repository.getAllVaildRecruitInfoUrl();
   expect(recruitInfoUrls.some((data) => {
      data.is_public = false
   })
    ).toBe(false);
    console.log('모든 채용 보여주기 가능한 정보 URL:', recruitInfoUrls);
  })


})
