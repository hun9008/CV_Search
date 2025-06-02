from fastapi import APIRouter
from schemas.schema import SearchESRequest
from test.elasticQuery import test_keyword_filter_query

router = APIRouter()

@router.post("/search-es")
def search_es_api(request: SearchESRequest):
    # ES 전체 검색
    results = test_keyword_filter_query(
        keyword=request.keyword,
        job_type=request.jobType,
        experience=request.experience,
        sido=request.sido,
        sigungu=request.sigungu,
        size=10000  # 전체에서 수동 페이징
    )

    total = len(results)
    start = request.page * request.size
    end = start + request.size

    paginated = results[start:end]

    job_ids = []
    for hit in paginated:
        source = hit.get("_source", {})
        job_id = source.get("id")
        if job_id is not None:
            job_ids.append({"job_id": job_id})

    return {
        "total": total,
        "results": job_ids
    }
