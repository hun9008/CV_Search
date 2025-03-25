const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// URL 항목 서브스키마 (suburl_list 배열의 항목)
const SubUrlSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  visited: {
    type: Boolean,
    default: false
  },
  visitedAt: Date,
  discoveredAt: Date,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  isRecruit: Boolean,
  success: Boolean,
  error: String,
  errors:{ type: [String], default: [] } ,
  finalUrl: String,
  text: String,
  title: String,
  meta: Schema.Types.Mixed,
  crawlStats: {
    total: Number,
    href: Number,
    onclick: Number
  },
  domain: String,
  redirected: Boolean,
  crawledUrls: { type: [String], default: [] } //

});


/**
 * SubUrl 항목의 상세 정보를 테이블 형식으로 로깅
 * @param {Object} logger - 로깅에 사용할 로거 객체
 * @returns {void}
 */
SubUrlSchema.methods.logSummary = function(logger) {
  try {
    if (!logger) {
      console.warn('로거가 제공되지 않았습니다. 기본 콘솔을 사용합니다.');
      logger = console;
    }

    // URL 기본 정보
    logger.info(`\nURL 항목 요약 정보:`);

    const basicInfo = {
      URL: this.url,
      도메인: this.domain || extractDomain(this.url),
      제목: this.title || '제목 없음',
      방문여부: this.visited ? '방문함' : '방문하지 않음',
      성공여부: this.success ? '성공' : this.visited ? '실패' : '미방문',
      리다이렉트: this.redirected ? `${this.url} → ${this.finalUrl}` : '없음',
      방문시간: this.visitedAt ? new Date(this.visitedAt).toLocaleString() : '없음',
      발견시간: this.discoveredAt ? new Date(this.discoveredAt).toLocaleString() : new Date(this.created_at).toLocaleString(),
      생성시간: new Date(this.created_at).toLocaleString(),
      수정시간: new Date(this.updated_at).toLocaleString()
    };

    console.table(basicInfo);

    // 크롤링 통계가 있으면 표시
    if (this.crawlStats) {
      const crawlStats = {
        '총 링크 수': this.crawlStats.total || 0,
        'href 링크 수': this.crawlStats.href || 0,
        'onclick 링크 수': this.crawlStats.onclick || 0
      };

      logger.info('크롤링 통계:');
      console.table(crawlStats);
    }

    // 메타 정보가 있으면 표시 (최상위 속성만)
    if (this.meta && typeof this.meta === 'object') {
      const metaInfo = {};

      // 중첩된 객체는 [Object]로 표시, 배열은 [Array(길이)]로 표시
      Object.keys(this.meta).forEach(key => {
        const value = this.meta[key];
        if (value === null || value === undefined) {
          metaInfo[key] = 'null';
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            metaInfo[key] = `[Array(${value.length})]`;
          } else {
            metaInfo[key] = '[Object]';
          }
        } else {
          // 문자열이 너무 길면 잘라서 표시
          const strValue = value.toString();
          metaInfo[key] = strValue.length > 50 ? strValue.substring(0, 47) + '...' : strValue;
        }
      });

      if (Object.keys(metaInfo).length > 0) {
        logger.info('메타 정보:');
        console.table(metaInfo);
      }
    }

    // 오류 정보가 있으면 표시
    if (this.error) {
      logger.error('오류 정보:', this.error);
    }

    // 텍스트 내용이 있으면 일부 표시
    if (this.text) {
      const textLength = this.text.length;
      const previewText = textLength > 200 ? this.text.substring(0, 197) + '...' : this.text;

      logger.info(`텍스트 내용 (${textLength} 글자):`);
      logger.info(previewText);
    }

  } catch (error) {
    if (logger) {
      logger.error('URL 항목 요약 정보 생성 중 오류 발생:', error);
    } else {
      console.error('URL 항목 요약 정보 생성 중 오류 발생:', error);
    }
  }
};
// 메인 VisitResult 스키마 (도메인 기반)
const VisitResultSchema = new Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  suburl_list: [SubUrlSchema], // 주의: 필드명이 suburl_list임 (suburlList가 아님)
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  url: String
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'domains'
});

// URL로 검색하는 static 메서드 추가
VisitResultSchema.statics.findByUrl = async function(url) {
  const domain = extractDomain(url);
  const result = await this.findOne({ domain });

  if (!result || !result.suburl_list) return null;

  // suburl_list 내에서 URL 검색
  const urlEntry = result.suburl_list.find(item => item.url === url);
  if (!urlEntry) return null;

  // URL 항목을 포함한 전체 결과 반환
  return {
    domain: result.domain,
    urlEntry
  };
};

// 방문하지 않은 URL 찾기
VisitResultSchema.statics.findUnvisitedUrl = async function(domain) {
  try {
    const result = await this.findOne({ domain });

    if (!result || !result.suburl_list) return null;

    // suburl_list 내에서 방문하지 않은 URL 찾기
    const unvisitedEntry = result.suburl_list.find(item => !item.visited);
    if (!unvisitedEntry) return null;

    return {
      url: unvisitedEntry.url,
      domain
    };
  } catch (error) {
    console.error(`도메인 ${domain}에서 방문하지 않은 URL 찾기 오류:`, error);
    return null;
  }
};

// 도메인 통계 가져오기
VisitResultSchema.statics.getDomainStatsEfficient = async function(logger) {
  try {
    // 모든 도메인 문서 가져오기
    const domains = await this.find({}).lean();

    // 도메인별 통계 계산
    const domainStats = domains.map(domain => {
      // 각 도메인의 URL 통계 계산
      const total = domain.suburl_list ? domain.suburl_list.length : 0;
      const visited = domain.suburl_list ? domain.suburl_list.filter(url => url.visited).length : 0;
      const pending = total - visited;

      return {
        domain: domain.domain,
        total,
        visited,
        pending
      };
    });

    // 전체 요약 통계 계산
    const summary = {
      totalDomains: domainStats.length,
      activeDomains: domainStats.filter(d => d.total > 0).length,
      totalUrls: domainStats.reduce((sum, d) => sum + d.total, 0),
      visitedUrls: domainStats.reduce((sum, d) => sum + d.visited, 0),
      pendingUrls: domainStats.reduce((sum, d) => sum + d.pending, 0)
    };

    if (logger) {
      logger.info(`도메인 통계: 총 ${summary.totalDomains}개 도메인, ${summary.totalUrls}개 URL (방문: ${summary.visitedUrls}, 대기: ${summary.pendingUrls})`);
    }

    return { domains: domainStats, summary };
  } catch (error) {
    if (logger) {
      logger.error('도메인 통계 계산 오류:', error);
    } else {
      console.error('도메인 통계 계산 오류:', error);
    }
    return { domains: [], summary: { totalDomains: 0, activeDomains: 0, totalUrls: 0, visitedUrls: 0, pendingUrls: 0 } };
  }
};


// 도메인 추출 헬퍼 함수
function extractDomain(url) {
  try {
    if (!url) return null;
    const hostname = new URL(url).hostname;
    return hostname;
  } catch (e) {
    console.error(`URL에서 도메인 추출 실패: ${url}`, e);
    return null;
  }
}



const SubUrl = mongoose.model('SubUrl', SubUrlSchema);


const VisitResult = mongoose.model('VisitResult', VisitResultSchema);

module.exports = {
  VisitResult,
  VisitResultSchema,
  SubUrl,
  SubUrlSchema,
  extractDomain
};