import * as logsRepo from "./systemlogs.repository";

export interface SystemLogInput {
  userId: number;
  action: string;
  entityType?: string;
  entityId?: number;
  description?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Ghi audit log cho các hành động quan trọng trong hệ thống.
 */
export async function createSystemLog(input: SystemLogInput): Promise<void> {
  try {
    await logsRepo.insertSystemLog({
      userId: input.userId,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      description: input.description ?? null,
      oldValue: input.oldValue !== undefined ? JSON.stringify(input.oldValue) : null,
      newValue: input.newValue !== undefined ? JSON.stringify(input.newValue) : null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (error) {
    // Log không nên làm crash main flow
    console.error("[SystemLog] Không thể ghi log:", error);
  }
}

export async function logAction(action: string, message: string, context?: unknown) {
  await createSystemLog({
    userId: 0,
    action,
    description: message,
  });
}

/**
 * Cleanup cron job - giữ log ít nhất 90 ngày (BR-84).
 */
export async function cleanupOldLogs() {
  // TODO: Implement BR-84
  // await logsRepo.deleteLogsOlderThan(90);
  throw new Error("TODO: Implemented by future devs");
}
