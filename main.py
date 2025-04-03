from fastapi import FastAPI, Query, Body, HTTPException
import uvicorn
from typing import Optional
from pydantic import BaseModel

from es_save_module import es_save_cv, es_save_jobs  

class CVRequest(BaseModel):
    u_id: int
    s3_url: str

app = FastAPI()

@app.post("/save-es-cv")
def save_cv_endpoint(
    u_id: Optional[int] = Query(None),
    s3_url: Optional[str] = Query(None),
    body: Optional[CVRequest] = Body(None)
):

    if body is not None:
        es_save_cv(body.s3_url, body.u_id)
        return {"message": f"CV saved via JSON body for user {body.u_id}"}
    else:
        if u_id is None or s3_url is None:
            raise HTTPException(status_code=400, detail="Need either JSON body with 'u_id' or query param 'u_id'.")
        es_save_cv(s3_url, u_id)
        return {"message": f"CV saved via query params for user {u_id}"}

@app.post("/save-es-jobs")
def save_jobs_endpoint(
    u_id: Optional[int] = Query(None),
    body: Optional[dict] = Body(None)
):

    if body is not None and "u_id" in body:
        es_save_jobs(body["u_id"])
        return {"message": f"Jobs saved via JSON body for user {body['u_id']}"}
    else:
        if u_id is None:
            raise HTTPException(status_code=400, detail="Need either JSON body with 'u_id' or query param 'u_id'.")
        es_save_jobs(u_id)
        return {"message": f"Jobs saved via query params for user {u_id}"}