import { IRecruitInfo } from '../models/recruitinfo-model';

export interface IRecruitInfoRepository {
  findByUrl(url : string):Promise<IRecruitInfo|null>
  findAll():Promise<IRecruitInfo[]>
  create(data : IRecruitInfo):Promise<Boolean>
  update(data: IRecruitInfo): Promise<Boolean>
  delete(url : string) : Promise<Boolean>
  findByKeyWord(): Promise<IRecruitInfo[]>
  findByExpiredDate():Promise<IRecruitInfo[]>
}

