export interface AssignRoleDto {
  roleIds: number[];
}

export type ValidateAssignRoleResult =
  | {
      success: true;
      data: AssignRoleDto;
    }
  | {
      success: false;
      message: string;
    };

export function validateAssignRoleDto(
  body: unknown
): ValidateAssignRoleResult {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return {
      success: false,
      message:
        "Dữ liệu gán quyền không hợp lệ",
    };
  }

  const input = body as Record<
    string,
    unknown
  >;

  if (!Array.isArray(input.roleIds)) {
    return {
      success: false,
      message:
        "roleIds phải là một mảng",
    };
  }

  const roleIds = [
    ...new Set(
      input.roleIds.map(Number)
    ),
  ];

  if (
    roleIds.length === 0 ||
    roleIds.some(
      (roleId) =>
        !Number.isInteger(roleId) ||
        roleId <= 0
    )
  ) {
    return {
      success: false,
      message:
        "Danh sách quyền không hợp lệ",
    };
  }

  return {
    success: true,
    data: {
      roleIds,
    },
  };
}