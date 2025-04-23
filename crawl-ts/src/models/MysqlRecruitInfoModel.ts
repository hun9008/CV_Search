import { Sequelize ,QueryTypes ,Op ,DataTypes ,Optional ,Model} from 'sequelize'
import { IBaseRecruitInfo, IDbRecruitInfo } from '../models/RecruitInfoModel';





/**
 * Sequelize 모델 정의를 위한 인터페이스
 * (creationAttributes에 사용됨)
 */

/**
 * Sequelize용 RecruitInfo 모델 클래스
 *
 *
 *
 */

export class MysqlRecruitInfoSequelize extends Model<IDbRecruitInfo > implements IDbRecruitInfo {
  public title!: string;
  public url!: string;
  public text!: string;
  public domain?: string;
  public created_at!: Date;
  public updated_at!: Date;
  public is_public!: boolean;
  public favicon?: string;

  // IGeminiResponse에서 상속받은 필드들
  public company_name?: string;
  public department?: string;
  public region_text?: string;
  public region_id?: string;
  public require_experience?: string;
  public job_description?: string;
  public job_type?: string;
  public apply_start_date?: string;
  public apply_end_date?: string;
  public requirements?: string;
  public preferred_qualifications?: string;
  public ideal_candidate?: string;

}

/**
 * Sequelize 모델 초기화 함수
 * @param sequelize Sequelize 인스턴스
 * @returns 초기화된 RecruitInfo 모델
 */
export function initRecruitInfoModel(sequelize: Sequelize): typeof MysqlRecruitInfoSequelize {
  MysqlRecruitInfoSequelize.init(
    {

      title: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING(2048),
        allowNull: false,
      },
      text: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        field: 'raw_jobs_text' // MySQL 데이터베이스에서 사용할 컬럼명
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'last_updated_at',
        defaultValue: DataTypes.NOW,
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      favicon: {
        type: DataTypes.TEXT,
      },
      company_name: {
        type: DataTypes.STRING(255),
      },
      department: {
        type: DataTypes.STRING(255),
      },
      region_text: {
        type: DataTypes.STRING(255),
      },
      region_id: {
        type: DataTypes.INTEGER,
      },
      require_experience: {
        type: DataTypes.STRING(255),
      },
      job_description: {
        type: DataTypes.TEXT,
      },
      job_type: {
        type: DataTypes.STRING(100),
      },
      apply_start_date: {
        type: DataTypes.DATE,
      },
      apply_end_date: {
        type: DataTypes.DATE,
      },
      requirements: {
        type: DataTypes.TEXT,
      },
      preferred_qualifications: {
        type: DataTypes.TEXT,
      },
      ideal_candidate: {
        type: DataTypes.TEXT,
      }
    },
    {
      sequelize,
      tableName: process.env.MYSQL_RECRUIT_TABLE,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'last_updated_at',// createdAt, updatedAt 자동 관리
      underscored: true, // 스네이크_케이스 컬럼명 사용
      indexes: [
        {
          fields: ['company_name'],
        },
        {
          fields: ['is_public'],
        },
      ],
    }
  );

  return MysqlRecruitInfoSequelize;
}

console.log(process.env.MYSQL_HOST);
  export const mysqlRecruitInfoSequelize = new Sequelize(
      process.env.MYSQL_DATABASE ?? 'localhost',
      process.env.MYSQL_USER ?? 'root' ,
      process.env.MYSQL_PASSWORD ?? '',
      {
        host: process.env.MYSQL_HOST ?? 'localhost',
        port: (process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306),
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool:  {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
        define: {
          underscored: true, // 컬럼명을 스네이크 케이스로 유지
          freezeTableName: false, // 기본 테이블명 규칙 사용 (복수형)
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
          timestamps: true // createdAt, updatedAt 자동 관리
        }
      }
  );
export const MysqlRecruitInfoModel = initRecruitInfoModel(mysqlRecruitInfoSequelize);
export const mysqlRecruitInfoModel = new MysqlRecruitInfoModel();