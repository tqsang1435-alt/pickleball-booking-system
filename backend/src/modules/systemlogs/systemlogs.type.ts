// ==========================================
// systemlogs.type.ts
// Definition of System Logs
// ==========================================

export interface SystemLog {
  LogId: number;
  LogLevel: "Info" | "Warning" | "Error" | "Critical";
  Action: string;
  Message: string;
  ContextData: string; // JSON string representing context
  CreatedAt: string; // BR-84: Kept for 90 days minimum
}
