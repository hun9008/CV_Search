from fastapi import APIRouter, HTTPException, Body
from schemas.schema import RecommendationRequest
from src.es_query_module import recommandation  
import traceback

router = APIRouter()

@router.post("/recommend-jobs")
def recommend_jobs(body: RecommendationRequest = Body(...)):
    try:
        results = recommandation(body.u_id, body.top_k)
        if not results:
            raise HTTPException(status_code=404, detail="No CV data found for this user.")
        
        response = [
            {
                "job_id": job_id,
                "score": round(combined_score, 2),
                "cosine_score": round(cosine_score, 2),
                "bm25_score": round(bm25_score, 2)
            }
            for job_id, combined_score, cosine_score, bm25_score in results
        ]
        return {"recommended_jobs": response}
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")