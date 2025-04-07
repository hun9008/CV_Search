from fastapi import APIRouter, Body, HTTPException
from schemas.schema import CVRequest, JobRequest
from src.es_save_module import es_save_cv, es_save_jobs

router = APIRouter()

@router.post("/save-es-cv")
def save_cv_endpoint(body: CVRequest = Body(...)):
    try:
        es_save_cv(body.s3_url, body.u_id)
        return {"message": f"CV saved via JSON body for user {body.u_id}"}
    except ValueError as e:
        # 예: 잘못된 URL 형식, 파싱 오류 등
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        # 예: Elasticsearch 연결 실패, 파일 없음 등
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/save-es-jobs")
def save_jobs_endpoint():
    try:
        es_save_jobs()
        return {"message": f"Jobs saved"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")