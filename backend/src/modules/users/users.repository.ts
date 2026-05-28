import { getPool, sql } from "@/database/connection";
import type { UpdateProfileDto } from "./users.dto";

export async function findAllUsers() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT 
      u.UserID,
      u.FullName,
      u.Email,
      u.PhoneNumber,
      u.AvatarURL,
      u.Gender,
      u.DateOfBirth,
      u.Address,
      u.Status,
      u.CreatedAt,
      u.UpdatedAt,
      STRING_AGG(r.RoleName, ', ') AS Roles
    FROM Users u
    LEFT JOIN UserRoles ur ON ur.UserID = u.UserID
    LEFT JOIN Roles r ON r.RoleID = ur.RoleID
    GROUP BY 
      u.UserID,
      u.FullName,
      u.Email,
      u.PhoneNumber,
      u.AvatarURL,
      u.Gender,
      u.DateOfBirth,
      u.Address,
      u.Status,
      u.CreatedAt,
      u.UpdatedAt
    ORDER BY u.UserID DESC
  `);

  return result.recordset;
}

export async function findUserById(userId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT 
        u.UserID,
        u.FullName,
        u.Email,
        u.PhoneNumber,
        u.AvatarURL,
        u.Gender,
        u.DateOfBirth,
        u.Address,
        u.Status,
        u.CreatedAt,
        u.UpdatedAt,
        STRING_AGG(r.RoleName, ', ') AS Roles
      FROM Users u
      LEFT JOIN UserRoles ur ON ur.UserID = u.UserID
      LEFT JOIN Roles r ON r.RoleID = ur.RoleID
      WHERE u.UserID = @UserID
      GROUP BY
        u.UserID,
        u.FullName,
        u.Email,
        u.PhoneNumber,
        u.AvatarURL,
        u.Gender,
        u.DateOfBirth,
        u.Address,
        u.Status,
        u.CreatedAt,
        u.UpdatedAt
    `);

  return result.recordset[0] || null;
}

export async function updateProfile(userId: number, data: UpdateProfileDto) {
  const pool = await getPool();

  await pool
    .request()
    .input("UserID", sql.Int, userId)
    .input("FullName", sql.NVarChar(100), data.fullName || null)
    .input("PhoneNumber", sql.NVarChar(20), data.phoneNumber || null)
    .input("AvatarURL", sql.NVarChar(255), data.avatarUrl || null)
    .input("Gender", sql.NVarChar(20), data.gender || null)
    .input("DateOfBirth", sql.Date, data.dateOfBirth || null)
    .input("Address", sql.NVarChar(255), data.address || null)
    .query(`
      UPDATE Users
      SET
        FullName = ISNULL(@FullName, FullName),
        PhoneNumber = ISNULL(@PhoneNumber, PhoneNumber),
        AvatarURL = ISNULL(@AvatarURL, AvatarURL),
        Gender = ISNULL(@Gender, Gender),
        DateOfBirth = ISNULL(@DateOfBirth, DateOfBirth),
        Address = ISNULL(@Address, Address),
        UpdatedAt = GETDATE()
      WHERE UserID = @UserID
    `);
}

export async function updateUserStatus(
  userId: number,
  status: "Active" | "Inactive" | "Locked"
) {
  const pool = await getPool();

  await pool
    .request()
    .input("UserID", sql.Int, userId)
    .input("Status", sql.NVarChar(20), status)
    .query(`
      UPDATE Users
      SET Status = @Status,
          UpdatedAt = GETDATE()
      WHERE UserID = @UserID
    `);
}