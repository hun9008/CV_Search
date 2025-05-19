"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const RecruitInfoRepository_1 = require("../../src/database/RecruitInfoRepository");
describe('Recruit Info Repository 확인', () => {
    let repository;
    repository = new RecruitInfoRepository_1.RecruitInfoRepository();
    beforeAll(async () => {
        await repository.initialize();
    });
    test('job 생성하면서 region_id 생성하기 Redis에 URL status 업데이트 하기', async () => {
        const recruitInfo = {
            title: 'Test Job',
            company_name: 'Test Company',
            url: 'https://example.com/job/123',
            text: 'Job description',
            job_description: 'Job description',
            job_type: '정규직/파견직',
            is_public: true,
            is_parse_success: true,
            is_it_recruit_info: true,
            is_recruit_info: true,
            region_id: [1, 2, 3], // 예시로 지역 ID 배열 추가
        };
        const createdRecruitInfo = await repository.createRecruitInfo(recruitInfo);
    });
});
//# sourceMappingURL=RecruitInfoRepository.test.js.map