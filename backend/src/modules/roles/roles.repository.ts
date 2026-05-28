import { getPool, sql } from "@/database/connection";
import type { CreateRoleInput, UpdateRoleInput } from "./roles.type";

export async function findAllRoles() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT RoleID, RoleName, Description, Status, CreatedAt
    FROM Roles
    ORDER BY RoleID ASC
  `);

  return result.recordset;
}

export async function findRoleById(roleId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("RoleID", sql.Int, roleId)
    .query(`
      SELECT RoleID, RoleName, Description, Status, CreatedAt
      FROM Roles
      WHERE RoleID = @RoleID
    `);

  return result.recordset[0];
}

export async function findRoleByName(roleName: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("RoleName", sql.NVarChar, roleName)
    .query(`
      SELECT RoleID, RoleName, Description, Status, CreatedAt
      FROM Roles
      WHERE RoleName = @RoleName
    `);

  return result.recordset[0];
}

export async function createRole(data: CreateRoleInput) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("RoleName", sql.NVarChar, data.roleName)
    .input("Description", sql.NVarChar, data.description || null)
    .query(`
      INSERT INTO Roles (RoleName, Description, Status)
      OUTPUT INSERTED.*
      VALUES (@RoleName, @Description, 'Active')
    `);

  return result.recordset[0];
}

export async function updateRole(roleId: number, data: UpdateRoleInput) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("RoleID", sql.Int, roleId)
    .input("RoleName", sql.NVarChar, data.roleName || null)
    .input("Description", sql.NVarChar, data.description || null)
    .input("Status", sql.NVarChar, data.status || null)
    .query(`
      UPDATE Roles
      SET
        RoleName = COALESCE(@RoleName, RoleName),
        Description = COALESCE(@Description, Description),
        Status = COALESCE(@Status, Status)
      OUTPUT INSERTED.*
      WHERE RoleID = @RoleID
    `);

  return result.recordset[0];
}

export async function getUserRoleCount(userId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT COUNT(*) AS Total
      FROM UserRoles
      WHERE UserID = @UserID
    `);

  return result.recordset[0].Total as number;
}

export async function checkUserRoleExists(userId: number, roleId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .input("RoleID", sql.Int, roleId)
    .query(`
      SELECT UserRoleID
      FROM UserRoles
      WHERE UserID = @UserID AND RoleID = @RoleID
    `);

  return result.recordset[0];
}

export async function assignRoleToUser(userId: number, roleId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .input("RoleID", sql.Int, roleId)
    .query(`
      INSERT INTO UserRoles (UserID, RoleID)
      OUTPUT INSERTED.*
      VALUES (@UserID, @RoleID)
    `);

  return result.recordset[0];
}

export async function removeRoleFromUser(userId: number, roleId: number) {
  const pool = await getPool();

  await pool
    .request()
    .input("UserID", sql.Int, userId)
    .input("RoleID", sql.Int, roleId)
    .query(`
      DELETE FROM UserRoles
      WHERE UserID = @UserID AND RoleID = @RoleID
    `);

  return true;
}

export async function findPermissionsByRoleId(roleId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("RoleID", sql.Int, roleId)
    .query(`
      SELECT 
        p.PermissionID,
        p.PermissionCode,
        p.PermissionName,
        p.ModuleName,
        p.Description,
        p.Status
      FROM RolePermissions rp
      JOIN Permissions p ON rp.PermissionID = p.PermissionID
      WHERE rp.RoleID = @RoleID
      ORDER BY p.ModuleName ASC
    `);

  return result.recordset;
}