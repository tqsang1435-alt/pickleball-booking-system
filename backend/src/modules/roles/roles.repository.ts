import {
  getPool,
  sql,
} from "@/database/connection";

import type {
  AdminRoleItem,
  AdminUserItem,
  PaginatedAdminUsers,
  RoleOption,
  UserListFilters,
} from "./roles.type";

interface UserDatabaseRow {
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber: string | null;
  Status: string;
  CreatedAt: Date | null;
  RolesJson: string | null;
}

export async function getAdminUsersFromDB(
  filters: UserListFilters
): Promise<PaginatedAdminUsers> {
  const pool = await getPool();

  const request = pool
    .request()
    .input(
      "Offset",
      sql.Int,
      (filters.page - 1) *
        filters.limit
    )
    .input(
      "Limit",
      sql.Int,
      filters.limit
    );

  const conditions: string[] = [
    "1 = 1",
  ];

  if (filters.search) {
    request.input(
      "Search",
      sql.NVarChar(255),
      `%${filters.search}%`
    );

    conditions.push(`
      (
        u.FullName LIKE @Search
        OR u.Email LIKE @Search
        OR u.PhoneNumber LIKE @Search
      )
    `);
  }

  if (filters.status) {
    request.input(
      "Status",
      sql.NVarChar(50),
      filters.status
    );

    conditions.push(
      "u.Status = @Status"
    );
  }

  if (filters.roleName) {
    request.input(
      "RoleName",
      sql.NVarChar(100),
      filters.roleName
    );

    conditions.push(`
      EXISTS (
        SELECT 1
        FROM UserRoles filterUr
        INNER JOIN Roles filterRole
          ON filterUr.RoleID =
            filterRole.RoleID
        WHERE filterUr.UserID =
            u.UserID
          AND filterRole.RoleName =
            @RoleName
      )
    `);
  }

  const whereClause =
    conditions.join("\n AND ");

  const result = await request.query(`
    SELECT COUNT(*) AS Total
    FROM Users u
    WHERE ${whereClause};

    SELECT
      u.UserID,
      u.FullName,
      u.Email,
      u.PhoneNumber,
      u.Status,
      u.CreatedAt,

      JSON_QUERY((
        SELECT
          r.RoleID AS roleId,
          r.RoleName AS roleName
        FROM UserRoles ur
        INNER JOIN Roles r
          ON ur.RoleID = r.RoleID
        WHERE ur.UserID = u.UserID
        ORDER BY r.RoleName
        FOR JSON PATH
      )) AS RolesJson

    FROM Users u

    WHERE ${whereClause}

    ORDER BY
      u.CreatedAt DESC,
      u.UserID DESC

    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
  `);

  const recordsets =
    result.recordsets as unknown as [
      Array<{ Total: number }>,
      UserDatabaseRow[],
    ];

  const total = Number(
    recordsets[0]?.[0]?.Total ?? 0
  );

  return {
    items: recordsets[1].map(
      mapUserRow
    ),

    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,

      totalPages: Math.max(
        Math.ceil(total / filters.limit),
        1
      ),
    },
  };
}

export async function getRolesFromDB(): Promise<
  AdminRoleItem[]
> {
  const pool = await getPool();

  const result =
    await pool.request().query(`
      SELECT
        RoleID,
        RoleName,
        Description,
        Status,
        CreatedAt
      FROM Roles
      ORDER BY RoleName ASC;
    `);

  return result.recordset.map(
    (row: {
      RoleID: number;
      RoleName: string;
      Description: string | null;
      Status: string;
      CreatedAt: Date | null;
    }) => ({
      roleId: Number(row.RoleID),
      roleName: row.RoleName,
      RoleID: Number(row.RoleID),
      RoleName: row.RoleName,
      Description: row.Description ?? null,
      Status: row.Status === "Inactive" ? "Inactive" : "Active",
      CreatedAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : null,
    })
  );
}

export async function getUserByIdFromDB(
  userId: number
): Promise<AdminUserItem | null> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "UserID",
      sql.Int,
      userId
    )
    .query(`
      SELECT
        u.UserID,
        u.FullName,
        u.Email,
        u.PhoneNumber,
        u.Status,
        u.CreatedAt,

        JSON_QUERY((
          SELECT
            r.RoleID AS roleId,
            r.RoleName AS roleName
          FROM UserRoles ur
          INNER JOIN Roles r
            ON ur.RoleID = r.RoleID
          WHERE ur.UserID = u.UserID
          ORDER BY r.RoleName
          FOR JSON PATH
        )) AS RolesJson

      FROM Users u
      WHERE u.UserID = @UserID;
    `);

  const row =
    result.recordset[0] as
      | UserDatabaseRow
      | undefined;

  return row
    ? mapUserRow(row)
    : null;
}

export async function replaceUserRolesInDB(
  userId: number,
  roleIds: number[]
): Promise<void> {
  const pool = await getPool();

  const transaction =
    new sql.Transaction(pool);

  await transaction.begin();

  try {
    const deleteRequest =
      new sql.Request(transaction);

    await deleteRequest
      .input(
        "UserID",
        sql.Int,
        userId
      )
      .query(`
        DELETE FROM UserRoles
        WHERE UserID = @UserID;
      `);

    for (const roleId of roleIds) {
      const insertRequest =
        new sql.Request(transaction);

      await insertRequest
        .input(
          "UserID",
          sql.Int,
          userId
        )
        .input(
          "RoleID",
          sql.Int,
          roleId
        )
        .query(`
          INSERT INTO UserRoles (
            UserID,
            RoleID
          )
          VALUES (
            @UserID,
            @RoleID
          );
        `);
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateUserStatusInDB(
  userId: number,
  status: string
): Promise<void> {
  const pool = await getPool();

  await pool
    .request()
    .input(
      "UserID",
      sql.Int,
      userId
    )
    .input(
      "Status",
      sql.NVarChar(50),
      status
    )
    .query(`
      UPDATE Users
      SET Status = @Status
      WHERE UserID = @UserID;
    `);
}

export async function countActiveAdminsFromDB(): Promise<number> {
  const pool = await getPool();

  const result =
    await pool.request().query(`
      SELECT
        COUNT(DISTINCT u.UserID)
          AS Total

      FROM Users u

      INNER JOIN UserRoles ur
        ON u.UserID = ur.UserID

      INNER JOIN Roles r
        ON ur.RoleID = r.RoleID

      WHERE r.RoleName = 'Admin'
        AND u.Status = 'Active';
    `);

  return Number(
    result.recordset[0]?.Total ?? 0
  );
}

function mapUserRow(
  row: UserDatabaseRow
): AdminUserItem {
  let roles: RoleOption[] = [];

  if (row.RolesJson) {
    try {
      roles = JSON.parse(
        row.RolesJson
      ) as RoleOption[];
    } catch {
      roles = [];
    }
  }

  return {
    userId: Number(row.UserID),
    fullName: row.FullName ?? "",
    email: row.Email ?? "",
    phoneNumber:
      row.PhoneNumber ?? null,
    status: row.Status ?? "",
    createdAt: row.CreatedAt
      ? new Date(
          row.CreatedAt
        ).toISOString()
      : null,
    roles,
  };
}

// ── Role CRUD ────────────────────────────────────────────────────────────────

export async function getRoleByIdFromDB(roleId: number) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("RoleID", sql.Int, roleId)
    .query(`
      SELECT RoleID, RoleName, Description, Status, CreatedAt
      FROM Roles
      WHERE RoleID = @RoleID
    `);
  return result.recordset[0] ?? null;
}

export async function createRoleInDB(input: { roleName: string; description?: string }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("RoleName", sql.NVarChar(50), input.roleName)
    .input("Description", sql.NVarChar(255), input.description ?? null)
    .query(`
      INSERT INTO Roles (RoleName, Description)
      OUTPUT inserted.RoleID, inserted.RoleName, inserted.Description, inserted.Status, inserted.CreatedAt
      VALUES (@RoleName, @Description)
    `);

  return result.recordset[0] ?? null;
}

export async function updateRoleInDB(roleId: number, input: { roleName?: string; description?: string; status?: string }) {
  const pool = await getPool();
  const setClauses: string[] = [];
  const req = pool.request().input("RoleID", sql.Int, roleId);

  if (input.roleName !== undefined) {
    setClauses.push("RoleName = @RoleName");
    req.input("RoleName", sql.NVarChar(100), input.roleName);
  }
  if (input.description !== undefined) {
    setClauses.push("Description = @Description");
    req.input("Description", sql.NVarChar(255), input.description || null);
  }
  if (input.status !== undefined) {
    setClauses.push("Status = @Status");
    req.input("Status", sql.NVarChar(30), input.status);
  }

  if (setClauses.length === 0) return;

  await req.query(`
    UPDATE Roles
    SET ${setClauses.join(", ")}
    WHERE RoleID = @RoleID
  `);
}

export async function countUsersWithRoleFromDB(roleId: number): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("RoleID", sql.Int, roleId)
    .query(`
      SELECT COUNT(*) AS cnt FROM UserRoles WHERE RoleID = @RoleID
    `);
  return Number(result.recordset[0]?.cnt ?? 0);
}

export async function deleteRoleFromDB(roleId: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("RoleID", sql.Int, roleId)
    .query(`DELETE FROM Roles WHERE RoleID = @RoleID`);
}
