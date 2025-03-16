/**
 * 페이지 방문 결과 모델
 * 웹 페이지 방문 결과를 표준화된 형식으로 관리
 */
class VisitResult {
  /**
   * 방문 결과 객체 생성
   * @param {Object} options - 방문 결과 옵션
   * @param {boolean} options.success - 방문 성공 여부
   * @param {string} options.url - 원본 URL
   * @param {string} options.finalUrl - 최종 URL (리다이렉트 후)
   * @param {string} options.domain - 원본 도메인
   * @param {string} options.finalDomain - 최종 도메인
   * @param {Object} options.pageContent - 페이지 콘텐츠 정보
   * @param {Array} options.crawledUrls - 발견된 URL 목록
   * @param {Object} options.urlsByDomain - 도메인별 URL 그룹
   * @param {string} options.error - 오류 메시지 (실패 시)
   */
  constructor(options = {}) {
    this.success = options.success || false;
    this.url = options.url || '';
    this.finalUrl = options.finalUrl || options.url || '';
    this.domain = options.domain || '';
    this.finalDomain = options.finalDomain || options.domain || '';
    this.pageContent = options.pageContent || { title: '', meta: {}, text: '' };
    this.crawledUrls = options.crawledUrls || [];
    this.herfUrls = [];
    this.onclickUrls =  [];
    this.errors = [];
    this.visitedAt = options.visitedAt || new Date().toISOString();
  }




/**
 * 데이터베이스 저장을 위한 포맷으로 변환
 * @returns {Object} 데이터베이스에 저장할 수 있는 형식의 객체
 */
toDbFormat() {
  // 기본 데이터 구조
  const dbFormat = {
    visited: true,
    updated_at: new Date(),
    success: this.success || false
  };

  // 방문 시간 정보
  if (this.visitedAt) {
    dbFormat.visitedAt = new Date(this.visitedAt);
  }

  // 페이지 콘텐츠 정보
  if (this.pageContent) {
    if (this.pageContent.text) {
      dbFormat.text = this.pageContent.text;
    }
    if (this.pageContent.title) {
      dbFormat.title = this.pageContent.title;
    }
    if (this.pageContent.meta && Object.keys(this.pageContent.meta).length > 0) {
      dbFormat.meta = this.pageContent.meta;
    }
  }

  // 오류 정보
  if (this.error) {
    dbFormat.error = this.error;
  }

  // URL 수집 통계 정보
  dbFormat.crawlStats = {
    total: this.crawledUrls?.length || 0,
    href: this.herfUrls?.length || 0,
    onclick: this.onclickUrls?.length || 0
  };

  // 리다이렉트 정보
  if (this.finalUrl && this.finalUrl !== this.url) {
    dbFormat.finalUrl = this.finalUrl;
    dbFormat.redirected = true;
  }

  // 최종 도메인 정보
  if (this.finalDomain && this.finalDomain !== this.domain) {
    dbFormat.finalDomain = this.finalDomain;
  }

  return dbFormat;
}

/**
 * 데이터베이스 업데이트를 위한 $set 객체 생성
 * @returns {Object} MongoDB $set 연산에 사용할 수 있는 객체
 */
toDbUpdateFormat() {
  const dbFormat = this.toDbFormat();
  const updateData = {};

  // suburl_list.$ 필드에 매핑
  Object.keys(dbFormat).forEach(key => {
    updateData[`suburl_list.$.${key}`] = dbFormat[key];
  });

  // 도메인 문서 갱신 시간 추가
  updateData['updated_at'] = new Date();

  return updateData;
}

/**
 * 데이터베이스에서 조회한 데이터로 VisitResult 객체 생성
 * @param {Object} dbData 데이터베이스에서 조회한 데이터
 * @returns {VisitResult} 새 VisitResult 인스턴스
 */
static fromDbData(dbData) {
  if (!dbData || !dbData.url) {
    throw new Error('Invalid database data: missing required fields');
  }

  return new VisitResult({
    url: dbData.url,
    domain: dbData.domain,
    finalUrl: dbData.finalUrl || dbData.url,
    finalDomain: dbData.finalDomain || dbData.domain,
    success: dbData.success || false,
    error: dbData.error || null,
    pageContent: {
      title: dbData.title || '',
      text: dbData.text || '',
      meta: dbData.meta || {}
    },
    // URL 목록은 DB에 저장하지 않으므로 기본값 사용
    crawledUrls: [],
    herfUrls: [],
    onclickUrls: [],
    visitedAt: dbData.visitedAt || dbData.updated_at || new Date()
  });
}

  /**
   * 콘솔 출력용 데이터 포맷 반환
   * @returns {Object} 콘솔 출력에 최적화된 데이터 객체
   */
  toConsoleFormat() {
    // 기본 정보
    const basicInfo = {
      '상태': this.success ? '성공 ✅' : '실패 ❌',
      'URL': `${this.url}${this.url !== this.finalUrl ? ` → ${this.finalUrl}` : ''}`,
      '도메인': `${this.domain}${this.domain !== this.finalDomain ? ` → ${this.finalDomain}` : ''}`,
      '제목': this.pageContent?.title || 'N/A',
      "에러": this.errors.length === 0 ? this.errors :'N/A',
      '방문 시간': new Date(this.visitedAt).toLocaleString()
    };

    if (this.error) {
      basicInfo['오류'] = this.error;
    }

    // URL 수집 통계
    const urlStats = {
      '총 수집 URL': this.crawledUrls?.length || 0,
      'href URL': this.herfUrls?.length || 0,
      'onclick URL': this.onclickUrls?.length || 0,
      '도메인 그룹': Object.keys(this.urlsByDomain || {}).length || 0
    };

    // 콘텐츠 통계
    const contentStats = {
      '텍스트 길이': this.pageContent?.text?.length || 0,
      '메타태그 수': Object.keys(this.pageContent?.meta || {}).length || 0
    };

    // 도메인별 URL 카운트 (상위 10개)
    const domainUrlCounts = this.urlsByDomain
      ? Object.entries(this.urlsByDomain)
          .map(([domain, urls]) => ({ '도메인': domain, 'URL 수': urls.length }))
          .sort((a, b) => b['URL 수'] - a['URL 수'])
          .slice(0, 10)
      : [];

    return {
      basicInfo,
      urlStats,
      contentStats,
      domainUrlCounts,
      // 전체 도메인 수 (상위 10개만 표시할 경우를 위해)
      totalDomains: Object.keys(this.urlsByDomain || {}).length || 0
    };
  }
  /**
   * 성공 결과 생성
   * @param {Object} options - 성공 결과 옵션
   * @returns {VisitResult} 성공 방문 결과 객체
   */
  static success(options) {
    return new VisitResult({
      ...options,
      success: true
    });
  }

  /**
   * 실패 결과 생성
   * @param {Object} options - 실패 결과 옵션
   * @returns {VisitResult} 실패 방문 결과 객체
   */
  static failed(options) {
    return new VisitResult({
      ...options,
      success: false
    });
  }

  /**
   * 부분 성공 결과 생성 (일부 데이터만 수집된 경우)
   * @param {Object} options - 부분 성공 결과 옵션
   * @param {string} options.error - 부분 실패 이유
   * @returns {VisitResult} 부분 성공 방문 결과 객체
   */
  static partial(options) {
    return new VisitResult({
      ...options,
      success: true,
      error: options.error || '부분 데이터만 수집됨'
    });
  }

  /**
   * 로그 형식으로 결과 요약 출력 (console.table 활용)
   * @param {Object} logger - 로거 객체
   */
  logSummary(logger) {
    logger.info(`===== 방문 결과 요약: ${this.url} =====`);

    // toConsoleFormat 메서드를 활용하여 구조화된 데이터 얻기
    const formattedData = this.toConsoleFormat();

    // 1. 기본 정보 출력
    try {
      console.log('\n📌 기본 정보:');
      console.table(formattedData.basicInfo);
    } catch (error) {
      // console.table을 지원하지 않는 환경을 위한 대체 출력
      logger.info('📌 기본 정보:');
      Object.entries(formattedData.basicInfo).forEach(([key, value]) => {
        logger.info(`  ${key}: ${value}`);
      });
    }

    // 2. URL 수집 통계 출력
    try {
      console.log('\n📊 URL 수집 통계:');
      console.table(formattedData.urlStats);
    } catch (error) {
      logger.info('📊 URL 수집 통계:');
      Object.entries(formattedData.urlStats).forEach(([key, value]) => {
        logger.info(`  ${key}: ${value}`);
      });
    }

    // 3. 콘텐츠 통계 출력
    try {
      console.log('\n📄 콘텐츠 통계:');
      console.table(formattedData.contentStats);
    } catch (error) {
      logger.info('📄 콘텐츠 통계:');
      Object.entries(formattedData.contentStats).forEach(([key, value]) => {
        logger.info(`  ${key}: ${value}`);
      });
    }

    // 4. 도메인별 URL 카운트 출력 (있는 경우에만)
    if (formattedData.domainUrlCounts.length > 0) {
      try {
        console.log('\n🌐 도메인별 URL 수집 현황:');
        console.table(formattedData.domainUrlCounts);

        // 표시되지 않은 도메인이 있는 경우
        if (formattedData.totalDomains > formattedData.domainUrlCounts.length) {
          logger.info(`  ... 외 ${formattedData.totalDomains - formattedData.domainUrlCounts.length}개 도메인`);
        }
      } catch (error) {
        logger.info('🌐 도메인별 URL 수집 현황:');
        formattedData.domainUrlCounts.forEach(item => {
          logger.info(`  ${item['도메인']}: ${item['URL 수']}개 URL`);
        });

        if (formattedData.totalDomains > formattedData.domainUrlCounts.length) {
          logger.info(`  ... 외 ${formattedData.totalDomains - formattedData.domainUrlCounts.length}개 도메인`);
        }
      }
    }

    // 구분선으로 요약 종료
    logger.info('\n=======================================');
  }
}

module.exports = { VisitResult };