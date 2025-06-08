from pydantic import BaseModel
from typing import List, Optional

class CVRequest(BaseModel):
    # u_id: int
    cv_id: int
    s3_url: str

class CVRequestTest(BaseModel):
    s3_url: str


class JobRequest(BaseModel):
    u_id: int

class RecommendationRequest(BaseModel):
    cv_id: int
    top_k: int = 10

class JobIDRequest(BaseModel):
    job_id: int



class JobIdDto(BaseModel):
    job_id: int

class SearchESResponse(BaseModel):
    total: int
    results: List[JobIdDto]

class SearchESRequest(BaseModel):
    keyword: Optional[str] = None
    jobType: Optional[List[str]] = None
    experience: Optional[List[str]] = None
    sido: Optional[List[str]] = None
    sigungu: Optional[List[str]] = None
    page: int = 0
    size: int = 10