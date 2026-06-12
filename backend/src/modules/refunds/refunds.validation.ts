// ==========================================
// refunds.validation.ts
// Input validation cho Refund module
// ==========================================

export type ValidationResult = { valid: true } | { valid: false; error: string };

/**
 * Validate body cho POST /api/refunds/request
 */
export function validateRequestRefundBody(body: any): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body không hợp lệ." };
  }

  const { bookingId, reason } = body;

  if (!bookingId || typeof bookingId !== "number" || !Number.isInteger(bookingId) || bookingId <= 0) {
    return { valid: false, error: "bookingId phải là số nguyên dương." };
  }

  if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
    return { valid: false, error: "reason không được để trống." };
  }

  if (reason.trim().length > 500) {
    return { valid: false, error: "reason không được vượt quá 500 ký tự." };
  }

  return { valid: true };
}

/**
 * Validate body cho POST /api/refunds/approve
 */
export function validateApproveRefundBody(body: any): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body không hợp lệ." };
  }

  const { refundCode } = body;

  if (!refundCode || typeof refundCode !== "string" || refundCode.trim().length === 0) {
    return { valid: false, error: "refundCode không được để trống." };
  }

  return { valid: true };
}

/**
 * Validate body cho POST /api/refunds/process (MoMo)
 */
export function validateProcessRefundBody(body: any): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body không hợp lệ." };
  }

  const { refundCode } = body;

  if (!refundCode || typeof refundCode !== "string" || refundCode.trim().length === 0) {
    return { valid: false, error: "refundCode không được để trống." };
  }

  return { valid: true };
}

/**
 * Validate body cho POST /api/refunds/complete-manual
 */
export function validateCompleteManualBody(body: any): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body không hợp lệ." };
  }

  const { refundCode } = body;

  if (!refundCode || typeof refundCode !== "string" || refundCode.trim().length === 0) {
    return { valid: false, error: "refundCode không được để trống." };
  }

  // note là optional, nhưng nếu có thì không được quá dài
  if (body.note && typeof body.note === "string" && body.note.length > 1000) {
    return { valid: false, error: "note không được vượt quá 1000 ký tự." };
  }

  return { valid: true };
}

/**
 * Validate body cho POST /api/refunds/reject
 */
export function validateRejectRefundBody(body: any): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body không hợp lệ." };
  }

  const { refundCode, rejectReason } = body;

  if (!refundCode || typeof refundCode !== "string" || refundCode.trim().length === 0) {
    return { valid: false, error: "refundCode không được để trống." };
  }

  if (!rejectReason || typeof rejectReason !== "string" || rejectReason.trim().length === 0) {
    return { valid: false, error: "rejectReason không được để trống." };
  }

  if (rejectReason.trim().length > 500) {
    return { valid: false, error: "rejectReason không được vượt quá 500 ký tự." };
  }

  return { valid: true };
}
