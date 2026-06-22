import { ChatbotSession } from "./ai.type";

export abstract class SessionManager {
  abstract getSession(conversationId: string): Promise<ChatbotSession>;
  abstract saveSession(conversationId: string, session: ChatbotSession): Promise<void>;
  abstract deleteSession(conversationId: string): Promise<void>;
}

export class InMemorySessionManager extends SessionManager {
  private sessions = new Map<string, ChatbotSession>();

  constructor() {
    super();
    // Background TTL cleanup interval (evicts sessions older than 30 mins)
    if (!(global as any).__chatbotSessionCleanupInterval) {
      (global as any).__chatbotSessionCleanupInterval = setInterval(() => {
        const now = Date.now();
        const TTL = 30 * 60 * 1000;
        for (const [key, session] of this.sessions.entries()) {
          if (now - session.lastUpdated > TTL) {
            this.sessions.delete(key);
            console.log(`[Chatbot Session] Evicted expired session ${key}`);
          }
        }
      }, 5 * 60 * 1000);
    }
  }

  public async getSession(conversationId: string): Promise<ChatbotSession> {
    let session = this.sessions.get(conversationId);
    if (!session) {
      session = { lastUpdated: Date.now() };
      this.sessions.set(conversationId, session);
    } else {
      session.lastUpdated = Date.now();
    }
    return session;
  }

  public async saveSession(conversationId: string, session: ChatbotSession): Promise<void> {
    session.lastUpdated = Date.now();
    this.sessions.set(conversationId, session);
  }

  public async deleteSession(conversationId: string): Promise<void> {
    this.sessions.delete(conversationId);
  }
}
