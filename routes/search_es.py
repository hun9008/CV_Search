from fastapi import APIRouter
from schemas.schema import SearchESRequest, SearchESResponse, JobIdDto
from src.es_query_search import test_keyword_filter_query

router = APIRouter()

@router.post("/search-es", response_model=SearchESResponse)
def search_es_api(request: SearchESRequest):
    results = test_keyword_filter_query(
        keyword=request.keyword,
        job_type=request.jobType,
        experience=request.experience,
        sido=request.sido,
        sigungu=request.sigungu,
        size=10000
    )

    total = len(results)
    start = request.page * request.size
    end = start + request.size

    paginated = results[start:end]

    job_ids = [
        JobIdDto(job_id=int(hit["_source"]["job_id"]))
        for hit in paginated
        if "job_id" in hit["_source"]
    ]

    return SearchESResponse(total=total, results=job_ids)
