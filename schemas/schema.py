from pydantic import BaseModel

class CVRequest(BaseModel):
    u_id: int
    s3_url: str

class JobRequest(BaseModel):
    u_id: int

class RecommendationRequest(BaseModel):
    u_id: int
    top_k: int = 10