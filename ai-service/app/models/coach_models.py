from pydantic import BaseModel, Field
from typing import List, Optional

class CoachCandidate(BaseModel):
    coachId: int
    name: str
    description: Optional[str] = ""
    teachingStyle: Optional[str] = ""
    expertise: Optional[str] = ""
    structuredScore: float = 0.0
    availabilityScore: float = 0.0
    trustScore: float = 0.0

class CoachRecommendRequest(BaseModel):
    level: str = ""
    budget: float = 0.0
    preferredTime: str = ""
    goals: List[str] = []
    styleText: str = ""
    candidates: List[CoachCandidate] = []

class CoachIntent(BaseModel):
    level: str
    goals: List[str]
    teachingStyle: List[str]
    preferredTime: List[str]
    avoid: List[str]
    competitiveLevel: str

class CoachScoreResult(BaseModel):
    coachId: int
    matchScore: float
    score: float
    semanticScore: float
    confidence: str
    reasons: List[str]

class CoachRecommendResponse(BaseModel):
    fallback: bool
    fallbackReason: Optional[str] = None
    parsedIntent: CoachIntent
    results: List[CoachScoreResult]

# Models dùng nội bộ cho LLM Output
class CoachEvaluation(BaseModel):
    coachId: int
    semanticScore: float = Field(description="Điểm số từ 0 đến 100 đánh giá mức độ phù hợp về mặt ngữ nghĩa")
    reasons: List[str] = Field(description="2-3 lý do ngắn gọn vì sao Coach này phù hợp dựa trên yêu cầu")

class LLMCoachResponse(BaseModel):
    parsedIntent: CoachIntent
    evaluations: List[CoachEvaluation]
