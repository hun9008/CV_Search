const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @route   GET /api/search
 * @desc    Get search results with optional keyword filtering
 * @query   {string} keywords - Comma-separated list of keywords to search for
 * @query   {number} limit - Maximum number of results to return (default: 50)
 * @query   {number} page - Page number for pagination (default: 1)
 * @access  Public
 */
router.get('/search', dataController.getResults);
router.post('/parse-cv', async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, error: '내용이 제공되지 않았습니다' });
        }

        // 스키마 정의
        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                success: {
                    type: SchemaType.BOOLEAN,
                    description: "채용공고인지 여부",
                },
                reason: {
                    type: SchemaType.STRING,
                    description: "채용공고가 아닌 경우 이유",
                },
                company_name: {
                    type: SchemaType.STRING,
                    description: "회사명",
                },
                department: {
                    type: SchemaType.STRING,
                    description: "부서",
                },
                experience: {
                    type: SchemaType.STRING,
                    description: "경력 요구사항",
                },
                description: {
                    type: SchemaType.STRING,
                    description: "직무 설명",
                },
                job_type: {
                    type: SchemaType.STRING,
                    description: "고용 형태",
                },
                posted_period: {
                    type: SchemaType.STRING,
                    description: "게시 기간",
                },
                requirements: {
                    type: SchemaType.STRING,
                    description: "필수 요건",
                },
                preferred_qualifications: {
                    type: SchemaType.STRING,
                    description: "우대 사항",
                },
                ideal_candidate: {
                    type: SchemaType.STRING,
                    description: "이상적인 후보자",
                }
            },
            required: ["success"]
        };

        // Configure the model
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-lite',
          generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        },
        });

        const promptText = `
당신은 채용공고 분석 전문가입니다. 다음 텍스트를 분석하여 채용공고인지 판단하세요.

만약 채용공고라면, 다음 정보를 추출하세요:
- company_name: 회사명
- department: 부서
- experience: 경력 요구사항
- description: 직무 설명
- job_type: 고용 형태 (정규직, 계약직 등)
- posted_period: 게시 기간
- requirements: 필수 요건
- preferred_qualifications: 우대 사항
- ideal_candidate: 이상적인 후보자

채용공고가 맞으면 success를 true로, 아니면 false로 설정하고 이유를 reason 필드에 제공하세요.
텍스트는 다음과 같습니다:

${content}
`;

      const genAIResult = await model.generateContent(promptText);

        // 응답 텍스트를 가져옴
        const responseText = genAIResult.response.text();

        // 디버깅용 로그 추가
        console.log('Gemini API 응답 텍스트:', responseText);

        try {
            // 텍스트를 JSON 객체로 파싱
            const parsedResponse = JSON.parse(responseText);

            // 파싱된 JSON 객체를 응답으로 전송
            return res.status(200).json(parsedResponse);
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);

            // JSON 파싱에 실패한 경우, 원본 텍스트를 그대로 전송
            return res.status(500).json({
                success: false,
                error: 'JSON 파싱 오류',
                rawResponse: responseText
            });
        }

    } catch (error) {
        console.error('텍스트 처리 중 오류 발생:', error);
        res.status(500).json({
            success: false,
            error: error.message || '텍스트를 파싱하는 중 오류가 발생했습니다'
        });
    }
});

module.exports = router;