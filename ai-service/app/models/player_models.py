from pydantic import BaseModel, Field
from typing import List, Optional

class PlayerProfileData(BaseModel):
    playerId: int
    name: str
    playingRole: str
    skillLevel: str
    experienceYears: int
    playStyle: str = ""
    goal: str = ""
    availableStartTime: str = ""
    availableEndTime: str = ""

# --- Teammate Matching Models ---
class TeammateCandidate(PlayerProfileData):
    skillComp: float
    roleComp: float
    schedOverlap: float
    expSim: float

class TeammateMatchRequest(BaseModel):
    user: PlayerProfileData
    candidates: List[TeammateCandidate] = []

class TeammateEvaluation(BaseModel):
    playerId: int
    semanticScore: float = Field(description="Điểm tương hợp từ 0-100 về phong cách và mục tiêu")
    reasons: List[str] = Field(description="2-3 lý do phù hợp bằng tiếng Việt")

class LLMTeammateResponse(BaseModel):
    results: List[TeammateEvaluation]

class TeammateMatchResult(BaseModel):
    player: PlayerProfileData
    score: Optional[float]
    reasons: List[str]

class TeammateMatchResponse(BaseModel):
    success: bool
    mode: str = "teammate"
    fallback: bool
    fallbackReason: Optional[str] = None
    results: List[TeammateMatchResult]


# --- Opponent Matching Models ---
class MyTeamData(BaseModel):
    players: List[PlayerProfileData]
    teamPower: float

class OpponentTeamCandidate(BaseModel):
    opponentTeamId: str
    players: List[PlayerProfileData]
    teamPower: float
    powerBal: float
    schedOverlap: float
    goalComp: float
    expBal: float

class OpponentMatchRequest(BaseModel):
    myTeam: MyTeamData
    opponentTeams: List[OpponentTeamCandidate] = []

class OpponentEvaluation(BaseModel):
    opponentTeamId: str
    semanticScore: float = Field(description="Điểm tương hợp lối chơi và mục tiêu giữa hai đội từ 0-100")
    reasons: List[str] = Field(description="2-3 lý do vì sao trận đấu cân bằng/cạnh tranh bằng tiếng Việt")

class LLMOpponentResponse(BaseModel):
    results: List[OpponentEvaluation]

class OpponentTeamData(BaseModel):
    players: List[PlayerProfileData]

class OpponentMatchResult(BaseModel):
    opponentTeam: OpponentTeamData
    opponentTeamId: str
    teamPower: float
    score: Optional[float]
    reasons: List[str]

class OpponentMatchResponse(BaseModel):
    success: bool
    mode: str = "opponent_team"
    fallback: bool
    fallbackReason: Optional[str] = None
    myTeam: MyTeamData
    results: List[OpponentMatchResult]
