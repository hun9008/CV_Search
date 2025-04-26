"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RecruitInfoModel_1 = require("../../models/RecruitInfoModel");
const logger_1 = require("../../utils/logger");
/**
 * 채용 정보 검색 및 조회
 * @param req - 요청 객체
 * @param res - 응답 객체
 */
const getJobs = async (req, res) => {
    try {
        // 더 명확한 로그 메시지 추가
        console.log('getJobs 함수가 호출되었습니다');
        console.log('Request Query:', req.query); // 전체 req 객체가 아닌 query만 로깅
        const { keywords = '', limit = '50', page = '1', complete = 'false' } = req.query;
        // 유효한 숫자로 변환
        const limitNum = parseInt(limit) || 50;
        const pageNum = parseInt(page) || 1;
        const skip = (pageNum - 1) * limitNum;
        // 검색 쿼리 구성
        const searchQuery = {}; // 성공한 채용공고만 표시
        // 키워드 검색 처리
        if (keywords && typeof keywords === 'string') {
            const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
            if (keywordArray.length > 0) {
                // 키워드 검색을 위한 $or 쿼리 구성
                searchQuery.$or = [
                    { title: { $regex: keywordArray.join('|'), $options: 'i' } },
                    { company_name: { $regex: keywordArray.join('|'), $options: 'i' } },
                    { department: { $regex: keywordArray.join('|'), $options: 'i' } },
                    { description: { $regex: keywordArray.join('|'), $options: 'i' } },
                    { requirements: { $regex: keywordArray.join('|'), $options: 'i' } },
                    { preferred_qualifications: { $regex: keywordArray.join('|'), $options: 'i' } },
                    { ideal_candidate: { $regex: keywordArray.join('|'), $options: 'i' } }
                ];
            }
        }
        // 완전한 데이터만 필터링 (completeOnly 파라미터가 'true'인 경우)
        if (complete === 'true') {
            console.log('complete true query');
            // 중요 필드들이 null이나 비어있지 않은 문서만 필터링
            searchQuery.company_name = { $nin: [null, ""] };
            searchQuery.department = { $nin: [null, ""] };
            // searchQuery.location = { $nin: [null, ""] };
            searchQuery.experience = { $nin: [null, ""] };
            searchQuery.job_type = { $nin: [null, ""] };
            searchQuery.description = { $nin: [null, ""] };
            searchQuery.preferred_qualifications = { $nin: [null, ""] };
            searchQuery.ideal_candidate = { $nin: [null, ""] };
            searchQuery.requirements = { $nin: [null, ""] };
        }
        // 총 결과 수 카운트 쿼리 실행
        const total = await RecruitInfoModel_1.RecruitInfoModel.countDocuments(searchQuery);
        // 검색 쿼리 실행 (페이지네이션 적용)
        const jobs = await RecruitInfoModel_1.RecruitInfoModel.find(searchQuery)
            .sort({ created_at: -1 }) // 최신순으로 정렬
            .skip(skip)
            .limit(limitNum);
        // 응답 전송
        res.status(200).json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
            jobs
        });
    }
    catch (error) {
        logger_1.defaultLogger.error('채용정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '채용정보를 조회하는 중 오류가 발생했습니다.'
        });
    }
};
/**
 * ID로 특정 채용정보 조회
 * @param req - 요청 객체
 * @param res - 응답 객체
 */
const getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await RecruitInfoModel_1.RecruitInfoModel.findById(id);
        if (!job) {
            res.status(404).json({
                success: false,
                error: '해당 ID의 채용정보를 찾을 수 없습니다.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            job
        });
    }
    catch (error) {
        logger_1.defaultLogger.error('채용정보 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '채용정보를 조회하는 중 오류가 발생했습니다.'
        });
    }
};
exports.default = {
    getJobs,
    getJobById
};
//# sourceMappingURL=jobsController.js.map