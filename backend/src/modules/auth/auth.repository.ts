import { getPool, sql } from "@/database/connection";
import type { RegisterInput } from "./auth.type";

export async function findUserByEmail(email: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("Email", sql.NVarChar(100), email)
    .query(`
      SELECT
        UserID,
        FullName,
        Email,
        PhoneNumber,
        PasswordHash,
        AvatarURL,
        Gender,
        DateOfBirth,
        Address,
        Status,
        FailedLoginAttempts,
        LockedUntil
      FROM Users
      WHERE Email = @Email
    `);

  return result.recordset[0] ?? null;
}

export async function findUserByPhoneNumber(phoneNumber: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("PhoneNumber", sql.NVarChar(20), phoneNumber)
    .query(`
      SELECT UserID
      FROM Users
      WHERE PhoneNumber = @PhoneNumber
    `);

  return result.recordset[0] ?? null;
}

export async function findRolesByUserId(userId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT r.RoleName
      FROM UserRoles ur
      INNER JOIN Roles r ON ur.RoleID = r.RoleID
      WHERE ur.UserID = @UserID
        AND r.Status = 'Active'
    `);

  return result.recordset.map((row: { RoleName: string }) => row.RoleName);
}

export async function createPendingRegister(data: {
  fullName: string;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  gender?: string | null;
  dateOfBirth?: string | Date | null;
  address?: string | null;
  otpHash: string;
  expiresAt: Date;
}) {
  const pool = await getPool();

  await pool
    .request()
    .input("FullName", sql.NVarChar(100), data.fullName)
    .input("Email", sql.NVarChar(100), data.email)
    .input("PhoneNumber", sql.NVarChar(20), data.phoneNumber)
    .input("PasswordHash", sql.NVarChar(255), data.passwordHash)
    .input("Gender", sql.NVarChar(20), data.gender ?? null)
    .input("DateOfBirth", sql.Date, data.dateOfBirth ?? null)
    .input("Address", sql.NVarChar(255), data.address ?? null)
    .input("OtpHash", sql.NVarChar(255), data.otpHash)
    .input("ExpiresAt", sql.DateTime2, data.expiresAt)
    .query(`
      INSERT INTO PendingUsers (
        FullName,
        Email,
        PhoneNumber,
        PasswordHash,
        Gender,
        DateOfBirth,
        Address,
        OtpHash,
        ExpiresAt
      )
      VALUES (
        @FullName,
        @Email,
        @PhoneNumber,
        @PasswordHash,
        @Gender,
        @DateOfBirth,
        @Address,
        @OtpHash,
        @ExpiresAt
      )
    `);
}

export async function findLatestPendingRegister(email: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("Email", sql.NVarChar(100), email)
    .query(`
      SELECT TOP 1 *
      FROM PendingUsers
      WHERE Email = @Email
        AND ExpiresAt > GETUTCDATE()
      ORDER BY CreatedAt DESC
    `);

  return result.recordset[0] ?? null;
}

export async function increasePendingRegisterAttempts(pendingId: number) {
  const pool = await getPool();

  await pool
    .request()
    .input("PendingID", sql.Int, pendingId)
    .query(`
      UPDATE PendingUsers
      SET Attempts = Attempts + 1
      WHERE PendingID = @PendingID
    `);
}

export async function deletePendingRegisterByEmail(email: string) {
  const pool = await getPool();

  await pool
    .request()
    .input("Email", sql.NVarChar(100), email)
    .query(`
      DELETE FROM PendingUsers
      WHERE Email = @Email
    `);
}

export async function createPlayerAccount(
  input: RegisterInput,
  passwordHash: string
) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const request = new sql.Request(transaction);

    const result = await request
      .input("FullName", sql.NVarChar(100), input.fullName)
      .input("Email", sql.NVarChar(100), input.email)
      .input("PhoneNumber", sql.NVarChar(20), input.phoneNumber)
      .input("PasswordHash", sql.NVarChar(255), passwordHash)
      .input("Gender", sql.NVarChar(20), input.gender ?? null)
      .input("DateOfBirth", sql.Date, input.dateOfBirth ?? null)
      .input("Address", sql.NVarChar(255), input.address ?? null)
      .query(`
        DECLARE @PlayerRoleID INT;

        SELECT @PlayerRoleID = RoleID
        FROM Roles
        WHERE RoleName = 'Player'
          AND Status = 'Active';

        IF @PlayerRoleID IS NULL
        BEGIN
          THROW 50010, 'Player role not found', 1;
        END;

        INSERT INTO Users (
          FullName,
          Email,
          PhoneNumber,
          PasswordHash,
          Gender,
          DateOfBirth,
          Address,
          Status
        )
        VALUES (
          @FullName,
          @Email,
          @PhoneNumber,
          @PasswordHash,
          @Gender,
          @DateOfBirth,
          @Address,
          'Active'
        );

        DECLARE @NewUserID INT = SCOPE_IDENTITY();

        INSERT INTO UserRoles (UserID, RoleID)
        VALUES (@NewUserID, @PlayerRoleID);

        INSERT INTO PlayerProfiles (
          UserID,
          MatchingStatus
        )
        VALUES (
          @NewUserID,
          'Available'
        );

        SELECT
          UserID,
          FullName,
          Email,
          PhoneNumber,
          AvatarURL,
          Gender,
          DateOfBirth,
          Address,
          Status,
          CreatedAt
        FROM Users
        WHERE UserID = @NewUserID;
      `);

    await transaction.commit();

    return result.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function increaseFailedLogin(email: string) {
  const pool = await getPool();

  await pool
    .request()
    .input("Email", sql.NVarChar(100), email)
    .query(`
      UPDATE Users
      SET
        FailedLoginAttempts = FailedLoginAttempts + 1,
        LockedUntil =
          CASE
            WHEN FailedLoginAttempts + 1 >= 5
            THEN DATEADD(MINUTE, 15, GETUTCDATE())
            ELSE LockedUntil
          END,
        Status =
          CASE
            WHEN FailedLoginAttempts + 1 >= 5
            THEN 'Locked'
            ELSE Status
          END,
        UpdatedAt = GETUTCDATE()
      WHERE Email = @Email
    `);
}

export async function resetFailedLogin(userId: number) {
  const pool = await getPool();

  await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      UPDATE Users
      SET
        FailedLoginAttempts = 0,
        LockedUntil = NULL,
        UpdatedAt = GETUTCDATE()
      WHERE UserID = @UserID
    `);
}

export async function findUserById(userId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT
        UserID,
        FullName,
        Email,
        PhoneNumber,
        AvatarURL,
        Gender,
        DateOfBirth,
        Address,
        Status
      FROM Users
      WHERE UserID = @UserID
    `);

  return result.recordset[0] ?? null;
}

export async function createEmailOtp(data: {
  userId?: number | null;
  email: string;
  otpHash: string;
  purpose: "RESET_PASSWORD";
  expiresAt: Date;
}) {
  const pool = await getPool();

  await pool
    .request()
    .input("UserID", sql.Int, data.userId ?? null)
    .input("Email", sql.NVarChar(100), data.email)
    .input("OtpHash", sql.NVarChar(255), data.otpHash)
    .input("Purpose", sql.NVarChar(50), data.purpose)
    .input("ExpiresAt", sql.DateTime2, data.expiresAt)
    .query(`
      INSERT INTO EmailOtps (
        UserID,
        Email,
        OtpHash,
        Purpose,
        ExpiresAt
      )
      VALUES (
        @UserID,
        @Email,
        @OtpHash,
        @Purpose,
        @ExpiresAt
      )
    `);
}

export async function findLatestValidOtp(
  email: string,
  purpose: "RESET_PASSWORD"
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("Email", sql.NVarChar(100), email)
    .input("Purpose", sql.NVarChar(50), purpose)
    .query(`
      SELECT TOP 1 *
      FROM EmailOtps
      WHERE Email = @Email
        AND Purpose = @Purpose
        AND IsUsed = 0
        AND ExpiresAt > GETUTCDATE()
      ORDER BY CreatedAt DESC
    `);

  return result.recordset[0] ?? null;
}

export async function markOtpUsed(otpId: number) {
  const pool = await getPool();

  await pool
    .request()
    .input("OtpID", sql.Int, otpId)
    .query(`
      UPDATE EmailOtps
      SET IsUsed = 1,
          UpdatedAt = GETUTCDATE()
      WHERE OtpID = @OtpID
    `);
}

export async function increaseOtpAttempts(otpId: number) {
  const pool = await getPool();

  await pool
    .request()
    .input("OtpID", sql.Int, otpId)
    .query(`
      UPDATE EmailOtps
      SET Attempts = Attempts + 1,
          UpdatedAt = GETUTCDATE()
      WHERE OtpID = @OtpID
    `);
}

export async function updatePasswordByEmail(
  email: string,
  passwordHash: string
) {
  const pool = await getPool();

  await pool
    .request()
    .input("Email", sql.NVarChar(100), email)
    .input("PasswordHash", sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE Users
      SET PasswordHash = @PasswordHash,
          UpdatedAt = GETUTCDATE()
      WHERE Email = @Email
    `);
}
export async function createGooglePlayerAccount(data: {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("FullName", sql.NVarChar(100), data.fullName)
    .input("Email", sql.NVarChar(100), data.email)
    .input("AvatarURL", sql.NVarChar(255), data.avatarUrl ?? null)
    .input("PasswordHash", sql.NVarChar(255), "GOOGLE_LOGIN")
    .query(`
      DECLARE @RoleID INT;

      SELECT @RoleID = RoleID
      FROM Roles
      WHERE RoleName = 'Player';

      IF @RoleID IS NULL
      BEGIN
        THROW 50010, 'Player role not found', 1;
      END;

      INSERT INTO Users (
        FullName,
        Email,
        PasswordHash,
        AvatarURL,
        Status
      )
      VALUES (
        @FullName,
        @Email,
        @PasswordHash,
        @AvatarURL,
        'Active'
      );

      DECLARE @UserID INT = SCOPE_IDENTITY();

      INSERT INTO UserRoles (UserID, RoleID)
      VALUES (@UserID, @RoleID);

      SELECT *
      FROM Users
      WHERE UserID = @UserID;
    `);

  return result.recordset[0];
}