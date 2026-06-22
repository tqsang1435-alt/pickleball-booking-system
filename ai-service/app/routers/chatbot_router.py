from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.llm_service import analyze_user_intent
from app.models.chatbot_models import ChatbotIntentResponse

router = APIRouter()

class AnalyzeIntentRequest(BaseModel):
    message: str

@router.post("/analyze-intent", response_model=ChatbotIntentResponse)
async def analyze_intent(request: AnalyzeIntentRequest):
    if not request.message or request.message.strip() == "":
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    try:
        result = analyze_user_intent(request.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
