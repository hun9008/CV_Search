from fastapi import FastAPI, UploadFile, File
import os
from pdf_extractor import extract_text_from_pdf
from elasticsearch_client import index_cv, search_jobs

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload_cv/")
async def upload_cv(file: UploadFile = File(...)):
    """
    사용자가 PDF 이력서를 업로드하면 텍스트를 추출 후 Elasticsearch에 저장
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # 파일 저장
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # PDF에서 텍스트 추출
    cv_text = extract_text_from_pdf(file_path)
    
    # Elasticsearch에 저장
    response = index_cv(file.filename, cv_text)
    
    return {"message": "CV uploaded and indexed", "response": response}

@app.get("/search_jobs/")
def search_jobs_api(query: str):
    """
    사용자의 검색어를 기반으로 관련 직무 공고 검색
    """
    results = search_jobs(query)
    return results
