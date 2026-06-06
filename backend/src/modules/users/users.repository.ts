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

export async function findStaffUsers() {
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
    INNER JOIN UserRoles ur ON ur.UserID = u.UserID
    INNER JOIN Roles r ON r.RoleID = ur.RoleID AND r.RoleName = 'Staff'
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

// ─── ADMIN: Create Staff Transaction ──────────────────────────

export async function createStaffAdminTransaction(
  data: import("./users.dto").CreateStaffAdminDto & { passwordHash: string }
) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Get RoleID for Staff
    const roleReq = new sql.Request(transaction);
    const roleResult = await roleReq.query(`SELECT RoleID FROM Roles WHERE RoleName = 'Staff'`);
    const roleId = roleResult.recordset[0]?.RoleID;
    if (!roleId) throw new Error("Role Staff không tồn tại trong hệ thống");

    // 2. Check if email exists
    const emailReq = new sql.Request(transaction);
    emailReq.input("Email", sql.NVarChar(100), data.email);
    const emailResult = await emailReq.query(`SELECT UserID FROM Users WHERE Email = @Email`);
    if (emailResult.recordset.length > 0) {
      const { AppError } = await import("@/utils/AppError");
      throw new AppError("Email này đã tồn tại.", 409);
    }

    // 2.5 Check if phone exists
    const normalizedPhone = data.phone ? data.phone.replace(/\\s+/g, '').trim() : null;
    if (normalizedPhone) {
      const phoneReq = new sql.Request(transaction);
      phoneReq.input("Phone", sql.NVarChar(20), normalizedPhone);
      const phoneResult = await phoneReq.query(`SELECT UserID FROM Users WHERE PhoneNumber = @Phone`);
      if (phoneResult.recordset.length > 0) {
        const { AppError } = await import("@/utils/AppError");
        throw new AppError("Số điện thoại này đã tồn tại.", 409);
      }
    }

    // 3. Insert User
    const userReq = new sql.Request(transaction);
    userReq.input("FullName", sql.NVarChar(100), data.fullName);
    userReq.input("Email", sql.NVarChar(100), data.email);
    userReq.input("PhoneNumber", sql.NVarChar(20), normalizedPhone);
    userReq.input("PasswordHash", sql.NVarChar(255), data.passwordHash);
    userReq.input("Status", sql.NVarChar(30), "Active");

    const userResult = await userReq.query(`
      INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, Status)
      OUTPUT INSERTED.UserID
      VALUES (@FullName, @Email, @PhoneNumber, @PasswordHash, @Status)
    `);
    const userId = userResult.recordset[0].UserID;

    // 4. Insert UserRoles
    const userRoleReq = new sql.Request(transaction);
    userRoleReq.input("UserID", sql.Int, userId);
    userRoleReq.input("RoleID", sql.Int, roleId);
    await userRoleReq.query(`
      INSERT INTO UserRoles (UserID, RoleID)
      VALUES (@UserID, @RoleID)
    `);

    await transaction.commit();
    return userId;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}