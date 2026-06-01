// ==========================================
// matching.type.ts
// Definition of Matching models
// ==========================================

export interface MatchingProfile {
  PlayerId: number;
  SkillLevel: number;
  PreferredPosition: string;
  YearsOfExperience: number;
  AvailabilityInfo: any;
}

export interface MatchingResult {
  MatchId: number;
  Player1Id: number;
  Player2Id: number;
  MatchScore: number;
  CreatedAt: string;
}
