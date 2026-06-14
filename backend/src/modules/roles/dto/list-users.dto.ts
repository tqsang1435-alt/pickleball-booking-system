import type {
  UserListFilters,
} from "../roles.type";

export type ValidateUserListResult =
  | {
      success: true;
      data: UserListFilters;
    }
  | {
      success: false;
      message: string;
    };

export function validateUserListDto(
  searchParams: URLSearchParams
): ValidateUserListResult {
  const pageValue = Number(
    searchParams.get("page") ?? "1"
  );

  const limitValue = Number(
    searchParams.get("limit") ?? "10"
  );

  const page = Number.isFinite(pageValue)
    ? Math.max(
        Math.trunc(pageValue),
        1
      )
    : 1;

  const limit = Number.isFinite(limitValue)
    ? Math.min(
        Math.max(
          Math.trunc(limitValue),
          1
        ),
        100
      )
    : 10;

  const search =
    searchParams
      .get("search")
      ?.trim() || undefined;

  const status =
    searchParams
      .get("status")
      ?.trim() || undefined;

  const roleName =
    searchParams
      .get("roleName")
      ?.trim() || undefined;

  return {
    success: true,

    data: {
      page,
      limit,
      search,
      status,
      roleName,
    },
  };
}