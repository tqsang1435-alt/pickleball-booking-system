export interface LockAccountDto {
  reason?: string;
}

export type ValidateLockAccountResult =
  | {
      success: true;
      data: LockAccountDto;
    }
  | {
      success: false;
      message: string;
    };

export function validateLockAccountDto(
  body: unknown
): ValidateLockAccountResult {
  if (
    body === undefined ||
    body === null
  ) {
    return {
      success: true,
      data: {},
    };
  }

  if (
    typeof body !== "object"
  ) {
    return {
      success: false,
      message:
        "Dữ liệu khóa tài khoản không hợp lệ",
    };
  }

  const input = body as Record<
    string,
    unknown
  >;

  if (
    input.reason !== undefined &&
    typeof input.reason !== "string"
  ) {
    return {
      success: false,
      message:
        "Lý do khóa tài khoản không hợp lệ",
    };
  }

  const reason =
    typeof input.reason === "string"
      ? input.reason.trim()
      : undefined;

  if (
    reason &&
    reason.length > 500
  ) {
    return {
      success: false,
      message:
        "Lý do khóa không được vượt quá 500 ký tự",
    };
  }

  return {
    success: true,
    data: {
      reason:
        reason || undefined,
    },
  };
}