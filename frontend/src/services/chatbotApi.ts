import { apiClient } from "@/services/apiClient";

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

export interface ChatbotResponse {
  message: string;
  intent: string;
  actionType: 'TEXT' | 'COURT_SUGGESTIONS' | 'COACH_SUGGESTIONS' | 'CONFIRM_COURT_BOOKING' | 'CONFIRM_COACH_BOOKING' | 'CONFIRM_CANCEL_COURT_BOOKING' | 'CONFIRM_CANCEL_COACH_BOOKING' | 'CONFIRM_RESCHEDULE_COURT_BOOKING' | 'CONFIRM_RESCHEDULE_COACH_BOOKING' | 'LOGIN_REQUIRED' | 'ERROR';
  suggestedSlots?: CourtSlotSuggestion[];
  suggestedCoaches?: CoachSuggestion[];
  bookingDraft?: BookingDraft;
  coachBookingDraft?: CoachBookingDraft;
  needConfirmation?: boolean;
  missingFields?: string[];
  error?: string;
}

export async function sendChatbotMessage(
  message: string,
  conversationId?: string,
  token?: string | null
): Promise<ChatbotResponse> {
  return apiClient<ChatbotResponse>("/api/ai/chatbot/message", {
    method: "POST",
    body: { message, conversationId },
    token
  });
}
