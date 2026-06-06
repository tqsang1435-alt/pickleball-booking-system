import { insertAuditLog, AuditLogInput } from "./logs.repository";

export async function createAuditLog(input: AuditLogInput) {
  try {
    await insertAuditLog(input);
  } catch (error) {
    // Không throw error để tránh hỏng luồng business chính
    console.error("[AuditLog] Failed to create audit log:", error);
  }
}
