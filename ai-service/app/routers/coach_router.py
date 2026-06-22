import traceback
from fastapi import APIRouter, HTTPException
from app.models.coach_models import CoachRecommendRequest, CoachRecommendResponse
from app.services.coach_scoring_service import analyze_and_score_coaches

router = APIRouter()

@router.post("/recommend", response_model=CoachRecommendResponse)
async def recommend_coaches(request: CoachRecommendRequest):
    try:
        result = await analyze_and_score_coaches(request)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
