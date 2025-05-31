from fastapi import APIRouter, Body, HTTPException
from schemas.schema import CVRequest, JobRequest, CVRequestTest
from src.es_save_module import es_save_cv, es_save_jobs, extract_raw_text_from_pdf

router = APIRouter()

@router.post("/save-es-cv")
def save_cv_endpoint(body: CVRequest = Body(...)):
    try:
        es_save_cv(body.s3_url, body.cv_id)
        return {"message": f"CV saved via JSON body for CV {body.cv_id}"}
    except ValueError as e:
        # 예: 잘못된 URL 형식, 파싱 오류 등
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        # 예: Elasticsearch 연결 실패, 파일 없음 등
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/test-extract-text")
def test_extract_text_endpoint(body: CVRequestTest = Body(...)):
    try:
        raw_text = extract_raw_text_from_pdf(body.s3_url)
        if not raw_text.strip():
            raise ValueError("추출된 텍스트가 비어 있습니다.")
        return {"u_id": body.s3_url, "raw_text": raw_text}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"잘못된 요청: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")

@router.get("/save-es-jobs")
def save_jobs_endpoint():
    try:
        es_save_jobs()
        return {"message": f"Jobs saved"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")