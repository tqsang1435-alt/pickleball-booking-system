from fastapi import APIRouter, HTTPException
from app.models.player_models import (
    TeammateMatchRequest,
    TeammateMatchResponse,
    OpponentMatchRequest,
    OpponentMatchResponse
)
from app.services.player_scoring_service import (
    analyze_and_score_teammates,
    analyze_and_score_opponents
)

router = APIRouter()

@router.post("/match-teammates", response_model=TeammateMatchResponse)
async def match_teammates(request: TeammateMatchRequest):
    try:
        result = await analyze_and_score_teammates(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/match-opponents", response_model=OpponentMatchResponse)
async def match_opponents(request: OpponentMatchRequest):
    try:
        result = await analyze_and_score_opponents(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
