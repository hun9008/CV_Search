import { GeminiResponseRecruitInfoDTO} from '../models/RecruitInfoModel';
import { IRawContent } from '../models/RawContentModel';


/**
 * 파서 인터페이스
 * 모든 파서 구현체가 구현해야 하는 인터페이스
 */
export interface IParser {


  /**
   * 원본 콘텐츠를 파싱하여 채용 정보 추출
   * @param rawContent 원본 콘텐츠
   */
  parseRawContentRetry(rawContent: IRawContent, retryNumber: number): Promise<GeminiResponseRecruitInfoDTO | undefined>;


}