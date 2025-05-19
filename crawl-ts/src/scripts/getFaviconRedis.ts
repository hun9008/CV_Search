import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import { defaultLogger as logger } from '../utils/logger';
import { URL } from 'url';
import puppeteer from 'puppeteer';
import { Puppeteer, Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// 환경 변수 로드
dotenv.config();

// Redis 클라이언트 설정
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0')
});

// 설정 변수
const AXIOS_TIMEOUT = 15000;
const CONCURRENT_BATCH_SIZE = 5; // 동시에 처리할 도메인 수
const BROWSER_TIMEOUT = 30000; // 브라우저 작업 타임아웃
const TEMP_DIR = path.join(__dirname, '../../temp_favicons');

// 임시 디렉토리가 없으면 생성
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Static 폴더에서 favicon 파일을 찾아서 가져오기
 * @param domain 도메인 (예: example.com)
 * @returns Base64 인코딩된 favicon 또는 null
 */
async function getFaviconFromStaticStorage(domain: string): Promise<string | null> {
  try {
    logger.info(`[${domain}] Static 저장소에서 favicon 찾기 시작`);

    // 검색할 경로 목록 (프로젝트 내 모든 static 관련 폴더 고려)
    const staticPaths = [
      path.join(__dirname, '../../../crawl/public'),
      path.join(__dirname, '../../../crawl-ts/public'),
      path.join(__dirname, '../../public'),
      path.join(__dirname, '../../../public')
    ];

    // 확인할 파일명 패턴 목록
    const filePatterns = [
      `favicon.ico`,
      `favicon.png`,
      `${domain.replace(/\./g, '_')}_favicon.ico`,
      `${domain.replace(/\./g, '_')}_favicon.png`,
      `images/favicon.ico`,
      `images/favicon.png`,
      `img/favicon.ico`,
      `img/favicon.png`,
      `assets/favicon.ico`,
      `assets/favicon.png`,
      `static/favicon.ico`,
      `static/favicon.png`
    ];

    // 가능한 모든 경로 조합 시도
    for (const staticPath of staticPaths) {
      if (!fs.existsSync(staticPath)) continue;

      for (const pattern of filePatterns) {
        const fullPath = path.join(staticPath, pattern);

        if (fs.existsSync(fullPath)) {
          logger.info(`[${domain}] Static 저장소에서 favicon 파일 발견: ${fullPath}`);

          const fileData = fs.readFileSync(fullPath);
          const base64Favicon = fileData.toString('base64');

          return base64Favicon;
        }
      }
    }

    // 도메인별 폴더에서 찾기 시도
    for (const staticPath of staticPaths) {
      if (!fs.existsSync(staticPath)) continue;

      // 도메인 관련 하위 폴더 확인 (도메인명 또는 도메인을 언더스코어로 변환한 이름)
      const domainFolders = [
        domain,
        domain.replace(/\./g, '_'),
        domain.split('.')[0] // 첫 번째 부분만 (예: example.com -> example)
      ];

      for (const folder of domainFolders) {
        const domainFolder = path.join(staticPath, folder);

        if (fs.existsSync(domainFolder)) {
          // 해당 도메인 폴더 내 favicon 파일 찾기
          const faviconFiles = [
            'favicon.ico',
            'favicon.png',
            'icon.ico',
            'icon.png',
            'logo.ico',
            'logo.png'
          ];

          for (const file of faviconFiles) {
            const fullPath = path.join(domainFolder, file);

            if (fs.existsSync(fullPath)) {
              logger.info(`[${domain}] 도메인별 폴더에서 favicon 파일 발견: ${fullPath}`);

              const fileData = fs.readFileSync(fullPath);
              const base64Favicon = fileData.toString('base64');

              return base64Favicon;
            }
          }
        }
      }
    }

    logger.warn(`[${domain}] Static 저장소에서 favicon 파일을 찾지 못했습니다.`);
    return null;
  } catch (error) {
    logger.error(`[${domain}] Static 저장소에서 favicon 찾기 실패:`, error);
    return null;
  }
}



/**
 * Puppeteer로 웹사이트 방문해서 favicon 가져오기 (네트워크 요청 모니터링 포함)
 * @param domain 도메인 (예: example.com)
 * @param browser Puppeteer 브라우저 인스턴스
 * @returns Base64 인코딩된 favicon 또는 null
 */
async function getFaviconWithPuppeteer(domain: string, browser: Browser): Promise<string | null> {
  let page: Page | null = null;
  let base64Favicon: string | null = null;
  const tempFilePath = path.join(TEMP_DIR, `${domain.replace(/\./g, '_')}_favicon.png`);

  // 네트워크에서 감지된 favicon URL들을 저장할 배열
  const detectedFaviconUrls: string[] = [];

  try {
    // 1. 먼저 Static 저장소에서 favicon 찾기 시도
    base64Favicon = await getFaviconFromStaticStorage(domain);
    if (base64Favicon) {
      logger.info(`[${domain}] Static 저장소에서 favicon을 성공적으로 찾았습니다.`);
      return base64Favicon;
    }

    logger.info(`[${domain}] Puppeteer로 favicon 가져오기 시작`);

    // 새 페이지 생성
    page = await browser.newPage();

    // 타임아웃 설정
    page.setDefaultNavigationTimeout(BROWSER_TIMEOUT);

    // UserAgent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // 네트워크 요청 모니터링 설정
    await page.setRequestInterception(true);

    // 네트워크 요청 이벤트 처리
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();

      // favicon 관련 요청 감지 (URL에 favicon 또는 .ico가 포함되거나 resourceType이 image인 경우)
      if (
        (url.includes('favicon') || url.endsWith('.ico')) ||
        resourceType === 'image' ||
        resourceType === 'other'      ) {
        // 감지된 favicon URL 저장
        if (url.includes('favicon') || url.endsWith('.ico')) {
          logger.debug(`[${domain}] 네트워크 요청에서 favicon 감지: ${url}`);
          detectedFaviconUrls.push(url);
        }
        req.continue();
      } else if (resourceType === 'document' || resourceType === 'xhr') {
        req.continue();
      } else {
        // CSS, 폰트, 스크립트 등 불필요한 리소스 차단
        req.abort();
      }
    });

    // 응답 이벤트 처리 (콘텐츠 타입이 image인 경우 favicon일 가능성이 있음)
    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      // 이미지 타입이면서 favicon 관련 URL인 경우
      if (
        (contentType.includes('image/') || contentType.includes('image/x-icon')) &&
        (url.includes('favicon') || url.endsWith('.ico'))
      ) {
        try {
          logger.debug(`[${domain}] 네트워크 응답에서 favicon 감지: ${url} (Content-Type: ${contentType})`);
          detectedFaviconUrls.push(url);

          // 이미 favicon이 찾아져 있지 않은 경우에만 시도
          if (!base64Favicon) {
            const buffer = await response.buffer();
            if (buffer && buffer.length > 0) {
              // 임시 파일로 저장
              fs.writeFileSync(tempFilePath, buffer);

              // Base64로 인코딩
              base64Favicon = buffer.toString('base64');
              logger.info(`[${domain}] 네트워크 응답에서 favicon 저장 성공: ${url}`);
            }
          }
        } catch (responseError) {
          logger.warn(`[${domain}] 네트워크 응답 처리 중 오류: ${responseError}`);
        }
      }
    });

    // 웹사이트 방문
    logger.debug(`[${domain}] https://${domain} 방문 중...`);
    await page.goto(`https://${domain}`, { waitUntil: 'domcontentloaded' });

    // 잠시 대기 (추가 리소스 로딩을 위해)
    // await page.waitForNavigation();

    // 네트워크에서 감지된 favicon이 있는지 확인
    if (base64Favicon) {
      logger.info(`[${domain}] 네트워크 요청에서 favicon 추출 성공`);
      return base64Favicon;
    }

    // 네트워크 요청에서 감지된 favicon URL이 있는 경우 첫 번째 URL 사용
    if (detectedFaviconUrls.length > 0) {
      try {
        const faviconUrl = detectedFaviconUrls[0]; // 첫 번째 감지된 URL 사용
        logger.info(`[${domain}] 네트워크에서 감지된 favicon URL에서 다운로드 시도: ${faviconUrl}`);

        const response = await axios.get(faviconUrl, {
          responseType: 'arraybuffer',
          timeout: AXIOS_TIMEOUT
        });

        // 파일로 저장
        fs.writeFileSync(tempFilePath, response.data);

        // Base64로 인코딩
        base64Favicon = Buffer.from(response.data).toString('base64');
        logger.info(`[${domain}] 네트워크에서 감지된 favicon URL에서 다운로드 성공`);

        // 임시 파일 삭제
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        return base64Favicon;
      } catch (downloadError) {
        logger.warn(`[${domain}] 네트워크에서 감지된 favicon URL에서 다운로드 실패: ${downloadError}`);
      }
    }

    // 네트워크 요청 모니터링에서 찾지 못한 경우 이전 코드 계속 진행

    // favicon 정보 가져오기
    const faviconInfo = await page.evaluate(() => {
      const getLinkHref = (selector: string) => {
        const link = document.querySelector(selector) as HTMLLinkElement;
        return link ? link.href : null;
      };

      // 다양한 favicon 관련 link 태그 확인
      const selectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]',
        'link[rel="apple-touch-icon-precomposed"]',
        'link[rel="mask-icon"]',
        'link[rel="fluid-icon"]'
      ];

      for (const selector of selectors) {
        const href = getLinkHref(selector);
        if (href) return href;
      }

      // 기본 favicon 위치 확인
      return '/favicon.ico';
    });

    let faviconUrl = faviconInfo;

    // 상대 URL인 경우 절대 URL로 변환
    if (faviconUrl && !faviconUrl.startsWith('http')) {
      if (faviconUrl.startsWith('//')) {
        faviconUrl = `https:${faviconUrl}`;
      } else if (faviconUrl.startsWith('/')) {
        faviconUrl = `https://${domain}${faviconUrl}`;
      } else {
        faviconUrl = `https://${domain}/${faviconUrl}`;
      }
    }

    // 이미 네트워크에서 favicon을 추출했다면 여기서 종료
    if (base64Favicon) {
      return base64Favicon;
    }

    logger.debug(`[${domain}] HTML에서 찾은 Favicon URL: ${faviconUrl}`);

    // favicon 다운로드 및 저장
    if (faviconUrl) {
      // favicon 스크린샷 촬영 시도
      try {
        // Favicon 요소 찾기
        const faviconElement = await page.$('link[rel="icon"], link[rel="shortcut icon"]');

        if (faviconElement) {
          await faviconElement.screenshot({
            path: tempFilePath,
            omitBackground: true
          });

          // 파일을 Base64로 인코딩
          const fileData = fs.readFileSync(tempFilePath);
          base64Favicon = fileData.toString('base64');
          logger.debug(`[${domain}] Favicon 스크린샷 성공`);
        } else {
          // 스크린샷 실패 시 URL에서 직접 다운로드
          logger.debug(`[${domain}] Favicon 요소 찾기 실패, URL에서 직접 다운로드 시도`);
          const response = await axios.get(faviconUrl, {
            responseType: 'arraybuffer',
            timeout: AXIOS_TIMEOUT
          });

          // 파일로 저장
          fs.writeFileSync(tempFilePath, response.data);

          // Base64로 인코딩
          base64Favicon = Buffer.from(response.data).toString('base64');
          logger.debug(`[${domain}] Favicon URL에서 다운로드 성공`);
        }
      } catch (screenshotError) {
        logger.warn(`[${domain}] Favicon 스크린샷/다운로드 실패: ${screenshotError}`);

        // 페이지의 파비콘 가져오기 실패 시, 브라우저 탭 아이콘 가져오기 시도
        try {
          // Chrome의 favicon 서비스 사용
          const chromeFaviconUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=32`;

          const response = await axios.get(chromeFaviconUrl, {
            responseType: 'arraybuffer',
            timeout: AXIOS_TIMEOUT
          });

          // 파일로 저장
          fs.writeFileSync(tempFilePath, response.data);

          // Base64로 인코딩
          base64Favicon = Buffer.from(response.data).toString('base64');
          logger.debug(`[${domain}] Chrome 서비스에서 Favicon 다운로드 성공`);
        } catch (chromeError) {
          logger.error(`[${domain}] Chrome 서비스에서 Favicon 다운로드 실패: ${chromeError}`);
        }
      }
    }

    // 임시 파일 삭제
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return base64Favicon;
  } catch (error) {
    logger.error(`[${domain}] Puppeteer로 favicon 가져오기 실패:`, error);
    return null;
  } finally {
    // 페이지 닫기
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

/**
 * Redis에 favicon 저장
 * @param domain 도메인 이름
 * @param base64Data Base64 인코딩된 favicon 데이터
 * @returns 성공 여부
 */
async function storeFaviconInRedis(domain: string, base64Data: string): Promise<boolean> {
  try {
    const key = `favicon:${domain}`;
    await redisClient.set(key, base64Data);
    logger.debug(`[${domain}] Redis에 favicon 저장 성공: ${key}`);
    return true;
  } catch (error) {
    logger.error(`[${domain}] Redis에 favicon 저장 실패:`, error);
    return false;
  }
}

/**
 * 도메인에 이미 favicon이 있는지 확인
 * @param domain 확인할 도메인
 * @returns favicon 존재 여부
 */
async function domainHasFavicon(domain: string): Promise<boolean> {
  try {
    const key = `favicon:${domain}`;
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(`[${domain}] Favicon 존재 여부 확인 실패:`, error);
    return false;
  }
}

/**
 * 실패한 도메인 기록 (추후 재시도용)
 * @param domain 실패한 도메인
 */
async function recordFailedDomain(domain: string): Promise<void> {
  try {
    await redisClient.sadd('domains:favicon:failed', domain);
    logger.debug(`[${domain}] 실패한 도메인으로 기록 완료`);
  } catch (error) {
    logger.error(`[${domain}] 실패한 도메인 기록 실패:`, error);
  }
}

/**
 * 도메인을 Redis 세트에 추가
 * @param domain 추가할 도메인
 */
async function addDomainToSet(domain: string): Promise<void> {
  try {
    await redisClient.sadd('domains', domain);
  } catch (error) {
    logger.error(`[${domain}] 도메인 세트 추가 실패:`, error);
  }
}

/**
 * Redis 또는 다른 소스에서 도메인 목록 가져오기 (이미 favicon이 있는 도메인 제외)
 * @returns 처리할 도메인 목록
 */
async function getDomains(): Promise<string[]> {
  let allDomains: string[] = [];

  // 옵션 1: 환경 변수에서 도메인 가져오기
  const configDomains = process.env.FAVICON_DOMAINS?.split(',').map(d => d.trim());
  if (configDomains && configDomains.length > 0) {
    allDomains = configDomains;
  } else {
    // 옵션 2: Redis 세트에서 도메인 가져오기
    try {
      const domains = await redisClient.smembers('domains');
      if (domains && domains.length > 0) {
        allDomains = domains;
      }
    } catch (error) {
      logger.error('Redis에서 도메인 목록 가져오기 실패:', error);
    }

    // 실패한 도메인 추가
    try {
      const failedDomains = await redisClient.smembers('domains:favicon:failed');
      if (failedDomains && failedDomains.length > 0) {
        allDomains = [...new Set([...allDomains, ...failedDomains])];
      }
    } catch (error) {
      logger.error('Redis에서 실패한 도메인 목록 가져오기 실패:', error);
    }

    // 옵션 3: 도메인이 없으면 테스트용 하드코딩 목록 사용
    if (allDomains.length === 0) {
      allDomains = [
        'google.com',
        'github.com',
        'stackoverflow.com',
        'reddit.com',
        'amazon.com'
      ];
    }
  }

  logger.info(`필터링 전 총 ${allDomains.length}개 도메인 발견.`);

  // 이미 favicon이 있는 도메인 필터링
  const domainsToProcess: string[] = [];
  for (const domain of allDomains) {
    const hasFavicon = await domainHasFavicon(domain);
    if (!hasFavicon) {
      domainsToProcess.push(domain);
    }
  }

  logger.info(`필터링 후 ${domainsToProcess.length}개 도메인 처리 필요.`);
  return domainsToProcess;
}

/**
 * 단일 도메인 처리하여 favicon 찾고 저장
 * @param domain 처리할 도메인
 * @param browser Puppeteer 브라우저 인스턴스
 * @returns 상태 및 소스 정보
 */
async function processDomain(domain: string, browser: Browser): Promise<{
  success: boolean;
  domain: string;
  source: 'puppeteer' | null;
}> {
  logger.info(`도메인 처리 중: ${domain}`);

  try {
    // 도메인에 이미 favicon이 있는지 확인
    const hasFavicon = await domainHasFavicon(domain);
    if (hasFavicon) {
      logger.info(`[${domain}] 이미 Redis에 favicon 있음, 건너뜀.`);
      return { success: true, domain, source: null };
    }

    // Puppeteer로 favicon 가져오기
    const base64Favicon = await getFaviconWithPuppeteer(domain, browser);

    // 결과 처리
    if (base64Favicon) {
      const storeSuccess = await storeFaviconInRedis(domain, base64Favicon);
      if (storeSuccess) {
        logger.info(`[${domain}] Redis에 favicon 저장 성공.`);
        await addDomainToSet(domain);
        return { success: true, domain, source: 'puppeteer' };
      } else {
        logger.error(`[${domain}] Redis에 favicon 저장 실패.`);
        await recordFailedDomain(domain);
        return { success: false, domain, source: null };
      }
    } else {
      logger.error(`[${domain}] 모든 방법으로 favicon 가져오기 실패.`);
      await recordFailedDomain(domain);
      return { success: false, domain, source: null };
    }
  } catch (error) {
    logger.error(`[${domain}] 처리 중 예상치 못한 오류:`, error);
    await recordFailedDomain(domain);
    return { success: false, domain, source: null };
  }
}

/**
 * 메인 함수: 도메인 가져와서 favicon 추출/가져와서 Redis에 저장
 * 병렬 처리를 위해 Promise.all 사용
 */
async function main() {
  logger.info('스크립트 시작: 도메인에서 favicon 가져와서 Redis에 저장하기');

  let browser: Browser | null = null;

  try {
    // Redis 연결 테스트
    try {
      await redisClient.ping();
      logger.info('Redis 연결 성공.');
    } catch (redisError) {
      logger.error('Redis 연결 실패:', redisError);
      return;
    }

    // Puppeteer 브라우저 시작
    logger.info('Puppeteer 브라우저 실행 중...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,720'
      ]
    });

    // 처리할 도메인 가져오기
    const domains = await getDomains();

    if (!domains || domains.length === 0) {
      logger.info('처리할 도메인이 없습니다.');
      return;
    }

    logger.info(`${domains.length}개 도메인 처리 예정.`);

    // 통계 변수
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // 도메인을 배치로 나누어 처리
    for (let i = 0; i < domains.length; i += CONCURRENT_BATCH_SIZE) {
      const batch = domains.slice(i, i + CONCURRENT_BATCH_SIZE);
      logger.info(`배치 처리 중 ${Math.floor(i / CONCURRENT_BATCH_SIZE) + 1}/${Math.ceil(domains.length / CONCURRENT_BATCH_SIZE)} (${batch.length}개 도메인)`);

      // 배치 내의 도메인을 병렬로 처리
      const results = await Promise.all(batch.map(domain => processDomain(domain, browser!)));

      // 결과 집계
      for (const result of results) {
        processedCount++;

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // 배치 간 약간의 지연 추가
      if (i + CONCURRENT_BATCH_SIZE < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('--- Favicon 처리 요약 ---');
    logger.info(`총 처리된 도메인: ${processedCount}`);
    logger.info(`성공: ${successCount}`);
    logger.info(`실패: ${errorCount}`);
    logger.info('-----------------------');

  } catch (error) {
    logger.error('스크립트 실패: 실행 중 처리되지 않은 오류:', error);
  } finally {
    // 브라우저 종료
    if (browser) {
      await browser.close();
      logger.info('Puppeteer 브라우저 종료됨.');
    }

    // Redis 연결 종료
    await redisClient.quit();
    logger.info('Redis 연결 종료됨.');
  }
}

// 메인 함수 실행
main().catch(error => {
  logger.error('치명적인 스크립트 오류:', error);
  process.exit(1);
});