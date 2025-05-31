from pydantic import BaseModel

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