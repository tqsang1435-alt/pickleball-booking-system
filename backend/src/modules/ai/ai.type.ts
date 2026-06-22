export interface ChatbotAnalyzeRequest {
  message: string;
}

export interface ChatbotAnalyzeResponse {
  intent: string;
  parsedData: any;
  confidence: number;
  canAnswerDirectly?: boolean;
  replyHint?: string;
}

export interface CoachCandidate {
  coachId: number;
  name: string;
  description?: string;
  teachingStyle?: string;
  expertise?: string;
  structuredScore: number;
  availabilityScore: number;
  trustScore: number;
}

export interface CoachRecommendRequest {
  level?: string;
  budget?: number;
  preferredTime?: string;
  goals?: string[];
  styleText?: string;
}

export interface CoachScoreResult {
  coachId: number;
  matchScore: number;
  score: number;
  semanticScore: number;
  confidence: string;
  reasons: string[];
}

export interface CoachRecommendResponse {
  fallback: boolean;
  parsedIntent: any;
  results: CoachScoreResult[];
}

export interface PlayerCandidate {
  playerId: number;
  name: string;
  playingRole: string;
  skillLevel: string;
  playStyle?: string;
  goal?: string;
  structuredScore: number;
  scheduleScore: number;
  reliabilityScore: number;
}

export interface PlayerMatchRequest {
  playingRole?: string;
  skillLevel?: string;
  eloRating?: number;
  experienceYears?: number;
  availableStartTime?: string;
  availableEndTime?: string;
  preferredTime?: string;
  playStyle?: string;
  goal?: string;
  candidates?: PlayerCandidate[];
}

export interface PlayerScoreResult {
  playerId: number;
  matchScore: number;
  semanticScore: number;
  matchType: string;
  confidence: string;
  reasons: string[];
}

export interface PlayerMatchResponse {
  fallback: boolean;
  parsedProfile: any;
  results: PlayerScoreResult[];
}

export interface CourtSlotSuggestion {
  courtId?: number;
  courtName?: string;
  coachId?: number;
  coachName?: string;
  price: number;
  availableTime: string;
}

export interface CoachSuggestion {
  coachId: number;
  name: string;
  hourlyRate: number;
  skillLevel?: string;
  specialization?: string;
}

export interface BookingDraft {
  courtId: number;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  price?: number;
}

export interface CoachBookingDraft {
  coachId: number;
  coachName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  needCourtTogether?: boolean;
  courtId?: number;
  courtName?: string;
  price?: number;
}

export interface ChatbotSession {
  lastIntent?: string;
  bookingDraft?: BookingDraft;
  coachBookingDraft?: CoachBookingDraft;
  suggestedSlots?: CourtSlotSuggestion[];
  suggestedCoaches?: CoachSuggestion[];
  lastUpdated: number;
}

