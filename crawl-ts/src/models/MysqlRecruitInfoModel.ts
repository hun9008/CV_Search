import { Sequelize ,DataTypes ,Model} from 'sequelize'
import { CreateDBRecruitInfoDTO } from '../models/RecruitInfoModel';

export enum VALID_TYPE {
  ERROR = 3,
  EXPIRED = 2,
  ACTIVE = 1,
  DEFAULT = 0

};
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

export class MysqlRecruitInfoSequelize extends Model<CreateDBRecruitInfoDTO, CreateDBRecruitInfoDTO> {
  public id!: number;
  public title!: string;
  public url!: string;
  public text!: string;
  public created_at!: Date;
  public updated_at!: Date;
  public is_public!: boolean;
  public favicon?: string;
  public favicon_id?: number; // 파비콘 ID 추가
  public company_name?: string;
  public department?: string;
  public region_text?: string;
  public require_experience?: string;
  public job_description?: string;

  // 0: 기본 , 1: 채용 마감 , 2:  오류
  public job_valid_type?: number;

  public job_type?: string;
  public apply_start_date?: Date | null;
  public apply_end_date?: Date | null;
  public requirements?: string;
  public preferred_qualifications?: string;
  public ideal_candidate?: string;


}

export class MysqlJobRegionSequelize extends Model {
  public id!: number;
  public job_id!: number;
  public region_id!: number;
}

export class MysqlFaviconSequelize extends Model {
  public id!: number;
  public domain!: string;
  public favicon!: string;
}

export class MysqlJobValidTypeSequelize extends Model {
  public id!: number;
  public job_id!: number;
  public valid_type!: boolean;
}


MysqlRecruitInfoSequelize.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
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

    favicon_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'MysqlFaviconSequelize', // 참조할 모델 이름
          key: 'id', // 참조할 컬럼
        },
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
      require_experience: {
        type: DataTypes.STRING(255),
      },
      job_description: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      job_type: {
        type: DataTypes.STRING(100),
    },
    job_valid_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
       defaultValue: 0, // 기본값을 0으로 설정
    },
      apply_start_date: {
        type: DataTypes.DATE,
        validate: {
          isAfter: {
            args: '2000-01-01',
            msg: "유효한 날짜 형식이어야 합니다"
          },
          isBefore: {
            args: '2100-12-31',
            msg: "종료일은 2030년 12월 31일 이전이어야 합니다"
          }
        }
      },
    apply_end_date: {
        allowNull: true,
        type: DataTypes.DATE,
           validate: {
          isAfter: {
            args: '2000-01-01',
            msg: "유효한 날짜 형식이어야 합니다"
          },
          isBefore: {
            args: '2100-12-31',
            msg: "종료일은 2030년 12월 31일 이전이어야 합니다"
          }
        }
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
      sequelize: mysqlRecruitInfoSequelize,
      tableName: process.env.MYSQL_RECRUIT_TABLE,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'last_updated_at',// createdAt, updatedAt 자동 관리
      underscored: true, // 스네이크_케이스 컬럼명 사용
      indexes: [
        {
          unique: true,
          fields: ['url'  ],
          name: 'idx_url_prefix',
          using: 'BTREE',

        }
      ]
    }

);



MysqlJobRegionSequelize.init({
  job_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  region_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }

}, {
  sequelize: mysqlRecruitInfoSequelize,
  tableName: process.env.MYSQL_JOB_REGION_TABLE,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['job_id', 'region_id']
    }
  ]
})

MysqlFaviconSequelize.init({
  domain: {
    type: DataTypes.STRING(255),
    allowNull: false,
    primaryKey: true,
  },
  logo: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  sequelize: mysqlRecruitInfoSequelize,
  tableName: process.env.MYSQL_FAVICON_TABLE,
  timestamps: false,
});

MysqlJobValidTypeSequelize.init({

  job_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  valid_type: {
    type: DataTypes.BIGINT,
    allowNull: false,
  }
}, {
  sequelize: mysqlRecruitInfoSequelize,
  tableName: process.env.MYSQL_JOB_VALID_TYPE_TABLE,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['job_id']
    }
  ]
});

MysqlRecruitInfoSequelize.hasOne(MysqlJobValidTypeSequelize, {
  foreignKey: 'job_id', // MysqlJobValidTypeSequelize 테이블에 있는 외래 키
  as: 'jobValidTypes',
  onDelete: 'CASCADE',// 선택적: 관계에 대한 별칭
});



