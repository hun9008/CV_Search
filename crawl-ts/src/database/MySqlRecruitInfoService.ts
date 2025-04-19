import { Sequelize ,QueryTypes ,Op} from 'sequelize'
import { MysqlDbRecruitInfo, RecruitInfoSequelize, initRecruitInfoModel, saveRecruitInfoToMySql } from '../models/recruitinfoModel';
import { defaultLogger as logger } from '../utils/logger';

/**
 * MySQL 데이터베이스 서비스 클래스
 * 채용 정보를 MySQL 데이터베이스에 저장하고 관리하는 서비스
 */
export class MySqlRecruitInfoService {
  private sequelize: Sequelize;
  private isConnected: boolean = false;
  private recruitInfoModel: typeof RecruitInfoSequelize;

  /**
   * MySQL 서비스 생성자
   * @param config MySQL 연결 설정
   */
  constructor(config: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    dialect?: 'mysql';
  }) {
    // 기본값과 병합하여 설정
    const dbConfig = {
      host: config.host ?? process.env.MYSQL_HOST ?? 'localhost',
      port: config.port ?? (process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306),
      username: config.username ?? process.env.MYSQL_USER ?? 'root',
      password: config.password ?? process.env.MYSQL_PASSWORD ?? '',
      database: config.database ?? process.env.MYSQL_DATABASE ?? 'crawl_db',
      dialect: 'mysql' as const,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };

    this.sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
        define: {
          underscored: true, // 컬럼명을 스네이크 케이스로 유지
          freezeTableName: false, // 기본 테이블명 규칙 사용 (복수형)
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
          timestamps: true // createdAt, updatedAt 자동 관리
        }
      }
    );

    // 모델 초기화
    this.recruitInfoModel = initRecruitInfoModel(this.sequelize);
  }

  /**
   * 데이터베이스 연결
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.sequelize.authenticate();
      logger.info('MySQL 연결 성공');
      this.isConnected = true;

      // 테이블 동기화 (없으면 생성)
      await this.sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      logger.info('MySQL 테이블 동기화 완료');
    } catch (error) {
      logger.error('MySQL 연결 실패:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 연결 종료
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.sequelize.close();
      logger.info('MySQL 연결 종료');
      this.isConnected = false;
    } catch (error) {
      logger.error('MySQL 연결 종료 중 오류:', error);
      throw error;
    }
  }

  /**
   * 채용 정보 저장
   * @param recruitInfo 저장할 채용 정보 객체
   * @returns 저장된 채용 정보 객체
   */
  async saveRecruitInfo(recruitInfo: Omit<MysqlDbRecruitInfo, 'id' | 'created_at' | 'updated_at'>): Promise<RecruitInfoSequelize> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await saveRecruitInfoToMySql(this.sequelize, recruitInfo);
    } catch (error) {
      logger.error('채용 정보 저장 중 오류:', error);
      throw error;
    }
  }

  /**
   * URL로 채용 정보 조회
   * @param url 조회할 URL
   * @returns 조회된 채용 정보 객체, 없으면 null
   */
  async findByUrl(url: string): Promise<RecruitInfoSequelize | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.recruitInfoModel.findOne({ where: { url } });
    } catch (error) {
      logger.error('URL로 채용 정보 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * ID로 채용 정보 조회
   * @param id 조회할 ID
   * @returns 조회된 채용 정보 객체, 없으면 null
   */
  async findById(id: number): Promise<RecruitInfoSequelize | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.recruitInfoModel.findByPk(id);
    } catch (error) {
      logger.error('ID로 채용 정보 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 채용 정보 목록 조회
   * @param options 조회 옵션
   * @returns 조회된 채용 정보 목록
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    isPublic?: boolean;
    domain?: string;
    companyName?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  } = {}): Promise<{ rows: RecruitInfoSequelize[]; count: number }> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const {
        limit = 10,
        offset = 0,
        isPublic,
        domain,
        companyName,
        orderBy = 'updated_at',
        orderDirection = 'DESC'
      } = options;

      // 필터 조건 구성
      const where: any = {};

      if (isPublic !== undefined) {
        where.is_public = isPublic;
      }

      if (domain) {
        where.domain = domain;
      }

      if (companyName) {
        where.company_name = companyName;
      }

      return await this.recruitInfoModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]],
      });
    } catch (error) {
      logger.error('채용 정보 목록 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 채용 정보 검색
   * @param keyword 검색 키워드
   * @param options 검색 옵션
   * @returns 검색 결과
   */
  async search(keyword: string, options: {
    limit?: number;
    offset?: number;
    isPublic?: boolean;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  } = {}): Promise<{ rows: RecruitInfoSequelize[]; count: number }> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const {
        limit = 10,
        offset = 0,
        isPublic = true,
        orderBy = 'updated_at',
        orderDirection = 'DESC'
      } = options;

      const where: any = {
        [Op.or]: [
          { title: { [Op.like]: `%${keyword}%` } },
          { company_name: { [Op.like]: `%${keyword}%` } },
          { job_description: { [Op.like]: `%${keyword}%` } },
          { requirements: { [Op.like]: `%${keyword}%` } }
        ]
      };

      if (isPublic !== undefined) {
        where.is_public = isPublic;
      }

      return await this.recruitInfoModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]],
      });
    } catch (error) {
      logger.error('채용 정보 검색 중 오류:', error);
      throw error;
    }
  }

  /**
   * 마감일 기준 채용 정보 조회
   * @param options 조회 옵션
   * @returns 조회된 채용 정보 목록
   */
  async findByDeadline(options: {
    isPast?: boolean;
    daysLeft?: number;
    limit?: number;
    offset?: number;
    isPublic?: boolean;
  } = {}): Promise<{ rows: RecruitInfoSequelize[]; count: number }> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const {
        isPast = false,
        daysLeft = 7,
        limit = 10,
        offset = 0,
        isPublic = true
      } = options;

      const now = new Date();
      const where: any = {
        apply_end_date: { [Op.ne]: null }
      };

      if (isPublic !== undefined) {
        where.is_public = isPublic;
      }

      if (isPast) {
        // 이미 마감된 채용 공고 조회
        where.apply_end_date = {
          [Op.lt]: this.sequelize.fn('NOW')
        };
      } else if (daysLeft > 0) {
        // N일 이내 마감되는 채용 공고 조회
        const future = new Date();
        future.setDate(now.getDate() + daysLeft);

        where.apply_end_date = {
          [Op.gte]: now,
          [Op.lte]: future
        };
      } else {
        // 마감되지 않은 모든 채용 공고 조회
        where.apply_end_date = {
          [Op.gt]: this.sequelize.fn('NOW')
        };
      }

      return await this.recruitInfoModel.findAndCountAll({
        where,
        limit,
        offset,
        order: isPast ?
          [['apply_end_date', 'DESC']] :
          [['apply_end_date', 'ASC']]
      });
    } catch (error) {
      logger.error('마감일 기준 채용 정보 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 도메인별 채용 정보 통계
   * @returns 도메인별 채용 정보 통계
   */
  async getDomainStats(): Promise<{ domain: string; count: number }[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const tableName = process.env.MYSQL_RECRUIT_TABLE || 'recruit_infos';

      const results = await this.sequelize.query(`
        SELECT domain, COUNT(*) as count
        FROM ${tableName}
        WHERE domain IS NOT NULL
        GROUP BY domain
        ORDER BY count DESC
        LIMIT 50
      `, { type: QueryTypes.SELECT });

      return results as { domain: string; count: number }[];
    } catch (error) {
      logger.error('도메인별 채용 정보 통계 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 시퀄라이즈 인스턴스 가져오기
   * @returns 시퀄라이즈 인스턴스
   */
  getSequelize(): Sequelize {
    return this.sequelize;
  }

  /**
   * 채용 정보 모델 가져오기
   * @returns 채용 정보 모델
   */
  getRecruitInfoModel(): typeof RecruitInfoSequelize {
    return this.recruitInfoModel;
  }
}