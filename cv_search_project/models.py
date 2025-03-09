from pydantic import BaseModel
from typing import Optional

class JobPosting(BaseModel):
    company: str
    department: str
    experience: str
    job_description: str
    employment_type: str
    posting_period: str
    requirements: str
    preferences: Optional[str] = None
    ideal_candidate: Optional[str] = None
    raw_text: str
