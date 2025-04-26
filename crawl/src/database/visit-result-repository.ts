import { VisitResultModel, SubUrlModel, ILogger, IDomainStats, IStatsSummary, IVisitResult } from '../models/visit-result-model';

// 리포지토리 인터페이스 (다양한 데이터베이스에 적용 가능)
export interface IVisitResultRepository {
  findByDomain(domain: string): Promise<VisitResultModel | null>;
  findByUrl(url: string): Promise<{ domain: string; urlEntry: SubUrlModel } | null>;
  findUnvisitedUrl(domain: string): Promise<{ url: string; domain: string } | null>;
  getDomainStats(logger?: ILogger): Promise<{ domains: IDomainStats[]; summary: IStatsSummary }>;
  createVisitResult(visitResult: IVisitResult): Promise<VisitResultModel>;
}