import 'dotenv/config'; // 환경 변수 로딩
import puppeteer, { Browser, Page } from 'puppeteer';
import { MysqlRecruitInfoSequelize, VALID_TYPE } from '../models/MysqlRecruitInfoModel';
import pLimit from 'p-limit';

// 입력 인터페이스
interface JobPostingInput {
    url: string;
    text: string; // 해당 URL에서 시간 순서대로 스크랩된 텍스트 목록
}

// 결과 상태 타입
type PostingStatus = '정상' | '마감' | '판단 불가' | '오류';
// 내부 상태 타입 (텍스트 분석 단계에서 사용)
type PreliminaryStatus = PostingStatus | '추가 확인 필요' | '마감 가능성 높음' | '진행 중 가능성 높음';

interface JobPostingAnalysisResult {
    status: PostingStatus;
    reason: string;
    details?: any; // 추가 정보 (예: 분석된 URL)
}

interface PreliminaryAnalysisResult {
    status: PreliminaryStatus;
    reason: string;
}

/**
 * 주어진 URL에 접속하여 실제 공고 상태를 확인합니다.
 * @param url 확인할 채용 공고 URL
 * @param browser Puppeteer 브라우저 인스턴스
 * @returns JobPostingAnalysisResult 라이브 확인 결과 (PostingStatus 타입의 status 사용)
 */
async function checkLiveUrl(url: string, browser: Browser): Promise<JobPostingAnalysisResult> {
  let page: Page | null = null;

  return new Promise<JobPostingAnalysisResult>(async (resolve, reject) => {
      try {
          page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36');

          await page.setRequestInterception(true);
          page.on('request', (req) => {
              if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                  req.abort();
              } else {
                  req.continue();
              }
          });

          // alert 발생 시 resolve 호출
        page.on('dialog', async (dialog) => {
          await dialog.dismiss();
            if (dialog.message().includes('마감') ||
                dialog.message().includes('아닙니다.') ||
                dialog.message().includes('종료되었습니다.') ||
                dialog.message().includes('만료')) {
            console.log(`[${url}] 페이지에서 알림창 발생: ${dialog.message()}`);
            if (page) await page.close();
            return resolve({
              status: '마감',
              reason: `페이지에서 alert 발생 - 마감된 공고일 수 있음`,
              details: { url }
          });
          }
        });

          const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

          await new Promise(resolve => setTimeout(resolve, 2000));// 페이지 로딩 타임아웃 설정

          const statusCode = response?.status() ?? 0;

          if (statusCode === 404 || statusCode === 410) {
              resolve({
                  status: '마감',
                  reason: `페이지를 찾을 수 없음 (HTTP 404). 삭제되었거나 마감된 공고일 가능성이 높습니다.`,
                  details: { url }
              });
          } else {
              // 살아있는 경우
              resolve({
                  status: '정상',
                  reason: `정상적으로 접속됨 (HTTP ${statusCode})`,
                  details: { url }
              });
          }
      } catch (error) {
          reject({
              status: '에러',
              reason: `페이지 분석 중 오류 발생`,
              details: { url, error: String(error) }
          });
      } finally {
        if (page?.isClosed()) {
            console.log(`[${url}] 페이지가 정상적으로 닫혔습니다.`);
        } else {
          await page?.close();
        }
      }
  });
}


/**
 * 주어진 채용 공고 URL과 스크랩된 텍스트 목록을 바탕으로 공고 마감 여부를 판단합니다.
 * @param url 채용 공고 URL
 * @param jobTexts 해당 URL에서 스크랩된 텍스트의 목록
 * @returns JobPostingAnalysisResult 최종 판단 결과
 */
export async function checkJobPostingExpiry(browser :Browser ,url: string, text: string): Promise<JobPostingAnalysisResult> {
    const currentDate = new Date();
    let liveCheckResult: JobPostingAnalysisResult | null = null;

    try {
        liveCheckResult = await checkLiveUrl(url, browser);

        return liveCheckResult;

    } catch (error: any) {
        console.error(`[${url}] 처리 중 전역 오류:`, error);
        return { status: '오류', reason: `전체 프로세스 중 예외 발생: ${error.message}`, details: { url } };
    }
}

// --- 예제 사용법 ---
async function runExamples() {
    const testCases = await MysqlRecruitInfoSequelize.findAll({
      attributes: ['url', 'text'],
  })
  // const testCases: JobPostingInput[] = [{
  //   url: 'https://recruit.navercorp.com/rcrt/view.do?annoId=30003200&lang=ko',
  //   text: '2024년 1월 1일에 마감된 공고입니다. 더 이상 지원할 수 없습니다.'
  // } ,{
  //   url: 'https://toss.im/career/job-detail?job_id=6542247003',
  //   text: '2024년 1월 1일에 마감된 공고입니다. 더 이상 지원할 수 없습니다.'
    // }
    // ];
        const browser = await puppeteer.launch({
        headless: true, // 'new' 또는 true 권장. false는 디버깅용.
        args: [
            '--no-sandbox', // Linux 환경에서 필요할 수 있음
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // CI 환경 등에서 메모리 문제 방지
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            // '--single-process', // Windows에서 문제 발생 시
            '--disable-gpu' // 일부 환경에서 GPU 문제 방지
      ],
        protocolTimeout: 2000000000, // 프로토콜 타임아웃 설정
        });
        const limit = pLimit(10);
        const promises = testCases.map(tc =>
          limit(async () => {
              console.log(`\n--- URL: ${tc.url} 확인 시작 ---`);
              const result = await checkJobPostingExpiry(browser, tc.url, tc.text);
              if (result.status === '마감') {
                  await MysqlRecruitInfoSequelize.update({ job_valid_type: VALID_TYPE.EXPIRED }, {
                        where: { url: tc.url }
                  })
              }
              console.log(`[최종 판단] 상태: ${result.status}`);
              console.log(`           사유: ${result.reason}`);
              if (result.details) {
                  console.log(`           세부정보: ${JSON.stringify(result.details)}`);
              }
              console.log(`--- URL: ${tc.url} 확인 종료 ---`);
              return result;
          })
      );
      await Promise.all(promises);

}

runExamples()
    .then(() => {
        console.log('모든 테스트 케이스 처리 완료.');
    })
    .catch((error) => {
        console.error('테스트 케이스 처리 중 오류 발생:', error);
    });