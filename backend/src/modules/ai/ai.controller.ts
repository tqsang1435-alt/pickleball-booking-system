import { handleChatbotMessage, recommendCoaches } from "./ai.service";
import { CoachRecommendRequest } from "./ai.type";

export async function processChatbotMessage(body: any, userId?: number, userRoles: string[] = []) {
  const { message, conversationId } = body;
  if (!message) {
    throw new Error("Message is required");
  }

  const result = await handleChatbotMessage(message, conversationId, userId, userRoles);
  return result;
}

export async function processCoachRecommendation(body: CoachRecommendRequest) {
  if (!body.styleText) {
    // Vẫn gọi nhưng LLM/Backend sẽ dùng fallback nếu cần
  }
  const result = await recommendCoaches(body);
  return result;
}

export async function processPlayerTeammateMatch(body: any) {
  const { matchTeammates } = await import("./ai.service");
  const { userId } = body;
  if (!userId) {
    throw new Error("UserID is required");
  }
  return matchTeammates(userId);
}

export async function processPlayerOpponentMatch(body: any) {
  const { matchOpponentTeams } = await import("./ai.service");
  const { userId } = body;
  if (!userId) {
    throw new Error("UserID is required");
  }
  return matchOpponentTeams(userId);
}

