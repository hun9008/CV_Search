from fastapi import APIRouter
from elasticsearch import Elasticsearch
from src.es_delete_module import delete_all_cv, delete_all_job, delete_job, delete_cv

router = APIRouter()

@router.delete(
    "/delete-all-cv",
    summary="Delete all CV documents from Elasticsearch",
    description="cv data 전부 삭제이니, 주의해서 사용하세요.",
)
async def delete_es_cv():
    try:
        delete_all_cv()
        return {"message": "All CVs deleted from Elasticsearch."}
    except Exception as e:
        return {"error": str(e)}
    return {"message": "CV deletion failed."}


@router.delete(
    "/delete-all-jobs",
    summary="Delete all job documents from Elasticsearch",
    description="job data 전부 삭제이니, 주의해서 사용하세요.",
)
async def delete_es_jobs():
    try:
        delete_all_job()
        return {"message": "All jobs deleted from Elasticsearch."}
    except Exception as e:
        return {"error": str(e)}
    return {"message": "Job deletion failed."}


@router.delete(
    "/delete-job",
    summary="Delete a specific job document from Elasticsearch",
    description="하나의 job data를 ES에서 삭제하고, RDB에서 is_public을 0으로 업데이트합니다.",
)
async def delete_job_endpoint(job_id: int):
    try:
        delete_job(job_id)
        return {"message": f"Job {job_id} deleted from Elasticsearch and updated in RDB."}
    except Exception as e:
        return {"error": str(e)}
    return {"message": "Job deletion failed."}

@router.delete(
    "/delete-cv",
    summary="Delete a specific CV document from Elasticsearch",
    description="하나의 CV data를 ES에서 삭제합니다.",
)
async def delete_cv_endpoint(user_id: int):
    try:
        delete_cv(user_id)
        return {"message": f"CV for user {user_id} deleted from Elasticsearch."}
    except Exception as e:
        return {"error": str(e)}
    return {"message": "CV deletion failed."}