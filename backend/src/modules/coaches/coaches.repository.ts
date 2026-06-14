// ============================================================
// coaches.repository.ts — Database access for Coaches module
// All raw SQL queries via mssql (getPool / sql)
// ============================================================

import { getPool, sql } from "@/database/connection";
import type {
  CoachListFilter,
  UpdateCoachProfileInput,
  UpdateCoachExpertiseInput,
  UpdateCoachFeeInput,
  UpdateCoachScheduleInput,
  CoachStatus,
} from "./coaches.type";

// ─── SELECT columns (public-safe, no passwordHash) ───────────

const COACH_PUBLIC_COLUMNS = `
  c.CoachID,
  c.UserID,
  u.FullName,
  u.Email,
  u.PhoneNumber,
  u.AvatarURL,
  c.ExperienceYears,
  c.SkillLevel,
  c.Specialization,
  c.Certifications,
  c.HourlyRate,
  c.Biography,
  c.AverageRating,
  c.TotalStudents,
  c.Status,
  c.CreatedAt,
  c.UpdatedAt
`;

// ─── PUBLIC: List active coaches ──────────────────────────────

export async function findAllApprovedCoaches(filter: CoachListFilter = {}) {
  const pool = await getPool();
  const req = pool.request();

  let where = `WHERE c.Status = 'Approved' AND u.Status = 'Active'`;

  if (filter.skillLevel) {
    req.input("SkillLevel", sql.NVarChar(30), filter.skillLevel);
    where += ` AND c.SkillLevel = @SkillLevel`;
  }

  if (filter.specialization) {
    req.input("Specialization", sql.NVarChar(255), `%${filter.specialization}%`);
    where += ` AND c.Specialization LIKE @Specialization`;
  }

  if (filter.minRate !== undefined) {
    req.input("MinRate", sql.Decimal(18, 2), filter.minRate);
    where += ` AND c.HourlyRate >= @MinRate`;
  }

  if (filter.maxRate !== undefined) {
    req.input("MaxRate", sql.Decimal(18, 2), filter.maxRate);
    where += ` AND c.HourlyRate <= @MaxRate`;
  }

  if (filter.minRating !== undefined) {
    req.input("MinRating", sql.Decimal(3, 2), filter.minRating);
    where += ` AND c.AverageRating >= @MinRating`;
  }

  const result = await req.query(`
    SELECT ${COACH_PUBLIC_COLUMNS}
    FROM Coaches c
    INNER JOIN Users u ON c.UserID = u.UserID
    ${where}
    ORDER BY c.AverageRating DESC, c.TotalStudents DESC
  `);

  return result.recordset;
}

// ─── PUBLIC: Coach detail by CoachID (Active only) ───────────

export async function findCoachById(coachId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .query(`
      SELECT ${COACH_PUBLIC_COLUMNS}
      FROM Coaches c
      INNER JOIN Users u ON c.UserID = u.UserID
      WHERE c.CoachID = @CoachID
        AND c.Status = 'Approved'
        AND u.Status = 'Active'
    `);

  return result.recordset[0] ?? null;
}

// ─── AUTH: Find coach by UserID (for /me endpoints) ──────────

export async function findCoachByUserId(userId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT ${COACH_PUBLIC_COLUMNS}
      FROM Coaches c
      INNER JOIN Users u ON c.UserID = u.UserID
      WHERE c.UserID = @UserID
    `);

  return result.recordset[0] ?? null;
}

// ─── AUTH: Update coach profile ───────────────────────────────

export async function updateCoachProfile(
  coachId: number,
  data: UpdateCoachProfileInput
) {
  const pool = await getPool();
  const req = pool.request().input("CoachID", sql.Int, coachId);

  const setClauses: string[] = ["UpdatedAt = GETDATE()"];

  if (data.experienceYears !== undefined) {
    req.input("ExperienceYears", sql.Int, data.experienceYears);
    setClauses.push("ExperienceYears = @ExperienceYears");
  }

  if (data.biography !== undefined) {
    req.input("Biography", sql.NVarChar(sql.MAX), data.biography ?? null);
    setClauses.push("Biography = @Biography");
  }

  if (data.specialization !== undefined) {
    req.input("Specialization", sql.NVarChar(255), data.specialization ?? null);
    setClauses.push("Specialization = @Specialization");
  }

  const result = await req.query(`
    UPDATE Coaches
    SET ${setClauses.join(", ")}
    OUTPUT
      INSERTED.CoachID,
      INSERTED.ExperienceYears,
      INSERTED.Biography,
      INSERTED.Specialization,
      INSERTED.UpdatedAt
    WHERE CoachID = @CoachID
  `);

  return result.recordset[0] ?? null;
}

// ─── AUTH: Update coach expertise ─────────────────────────────

export async function updateCoachExpertise(
  coachId: number,
  data: UpdateCoachExpertiseInput
) {
  const pool = await getPool();
  const req = pool.request().input("CoachID", sql.Int, coachId);

  const setClauses: string[] = ["UpdatedAt = GETDATE()"];

  if (data.skillLevel !== undefined) {
    req.input("SkillLevel", sql.NVarChar(30), data.skillLevel);
    setClauses.push("SkillLevel = @SkillLevel");
  }

  if (data.specialization !== undefined) {
    req.input("Specialization", sql.NVarChar(255), data.specialization ?? null);
    setClauses.push("Specialization = @Specialization");
  }

  if (data.certifications !== undefined) {
    req.input("Certifications", sql.NVarChar(255), data.certifications ?? null);
    setClauses.push("Certifications = @Certifications");
  }

  if (data.experienceYears !== undefined) {
    req.input("ExperienceYears", sql.Int, data.experienceYears);
    setClauses.push("ExperienceYears = @ExperienceYears");
  }

  const result = await req.query(`
    UPDATE Coaches
    SET ${setClauses.join(", ")}
    OUTPUT
      INSERTED.CoachID,
      INSERTED.SkillLevel,
      INSERTED.Specialization,
      INSERTED.Certifications,
      INSERTED.ExperienceYears,
      INSERTED.UpdatedAt
    WHERE CoachID = @CoachID
  `);

  return result.recordset[0] ?? null;
}

// ─── AUTH: Update coach hourly rate ──────────────────────────

export async function updateCoachFee(
  coachId: number,
  data: UpdateCoachFeeInput
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .input("HourlyRate", sql.Decimal(18, 2), data.hourlyRate)
    .query(`
      UPDATE Coaches
      SET HourlyRate = @HourlyRate, UpdatedAt = GETDATE()
      OUTPUT
        INSERTED.CoachID,
        INSERTED.HourlyRate,
        INSERTED.UpdatedAt
      WHERE CoachID = @CoachID
    `);

  return result.recordset[0] ?? null;
}

// ─── SCHEDULES: Find my schedules ────────────────────────────

export async function findCoachSchedules(coachId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .query(`
      SELECT
        CoachScheduleID,
        CoachID,
        CONVERT(VARCHAR(10), WorkingDate, 120) AS WorkingDate,
        CONVERT(VARCHAR(5), StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), EndTime, 108) AS EndTime,
        Status,
        HoldUntil,
        CreatedAt,
        UpdatedAt
      FROM CoachSchedules
      WHERE CoachID = @CoachID
        AND Status != 'Cancelled'
      ORDER BY WorkingDate ASC, StartTime ASC
    `);

  return result.recordset;
}

// ─── SCHEDULES: Check for overlap ────────────────────────────

export async function checkScheduleOverlap(
  coachId: number,
  workingDate: string,
  startTime: string,
  endTime: string,
  excludeScheduleId?: number
) {
  const pool = await getPool();
  const req = pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .input("WorkingDate", sql.Date, workingDate)
    .input("StartTime", sql.VarChar(5), startTime)
    .input("EndTime", sql.VarChar(5), endTime);

  let excludeClause = "";
  if (excludeScheduleId) {
    req.input("ExcludeID", sql.Int, excludeScheduleId);
    excludeClause = "AND CoachScheduleID != @ExcludeID";
  }

  const result = await req.query(`
    SELECT COUNT(*) AS OverlapCount
    FROM CoachSchedules
    WHERE CoachID = @CoachID
      AND WorkingDate = @WorkingDate
      AND Status NOT IN ('Cancelled', 'Unavailable')
      AND CAST(@StartTime AS TIME) < EndTime
      AND CAST(@EndTime AS TIME) > StartTime
      ${excludeClause}
  `);

  return (result.recordset[0]?.OverlapCount ?? 0) > 0;
}

// ─── SCHEDULES: Create schedule ───────────────────────────────

export async function createCoachSchedule(data: {
  coachId: number;
  workingDate: string;
  startTime: string;
  endTime: string;
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, data.coachId)
    .input("WorkingDate", sql.Date, data.workingDate)
    .input("StartTime", sql.VarChar(5), data.startTime)
    .input("EndTime", sql.VarChar(5), data.endTime)
    .query(`
      INSERT INTO CoachSchedules (CoachID, WorkingDate, StartTime, EndTime, Status)
      OUTPUT
        INSERTED.CoachScheduleID,
        INSERTED.CoachID,
        CONVERT(VARCHAR(10), INSERTED.WorkingDate, 120) AS WorkingDate,
        CONVERT(VARCHAR(5), INSERTED.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), INSERTED.EndTime, 108) AS EndTime,
        INSERTED.Status,
        INSERTED.CreatedAt
      VALUES (
        @CoachID,
        @WorkingDate,
        CAST(@StartTime AS TIME),
        CAST(@EndTime AS TIME),
        'Available'
      )
    `);

  return result.recordset[0];
}

// ─── SCHEDULES: Update schedule ───────────────────────────────

export async function updateCoachSchedule(
  scheduleId: number,
  coachId: number,
  data: UpdateCoachScheduleInput
) {
  const pool = await getPool();
  const req = pool
    .request()
    .input("CoachScheduleID", sql.Int, scheduleId)
    .input("CoachID", sql.Int, coachId);

  const setClauses: string[] = ["UpdatedAt = GETDATE()"];

  if (data.workingDate) {
    req.input("WorkingDate", sql.Date, data.workingDate);
    setClauses.push("WorkingDate = @WorkingDate");
  }

  if (data.startTime) {
    req.input("StartTime", sql.VarChar(5), data.startTime);
    setClauses.push("StartTime = CAST(@StartTime AS TIME)");
  }

  if (data.endTime) {
    req.input("EndTime", sql.VarChar(5), data.endTime);
    setClauses.push("EndTime = CAST(@EndTime AS TIME)");
  }

  if (data.status) {
    req.input("Status", sql.NVarChar(30), data.status);
    setClauses.push("Status = @Status");
  }

  const result = await req.query(`
    UPDATE CoachSchedules
    SET ${setClauses.join(", ")}
    OUTPUT
      INSERTED.CoachScheduleID,
      INSERTED.CoachID,
      CONVERT(VARCHAR(10), INSERTED.WorkingDate, 120) AS WorkingDate,
      CONVERT(VARCHAR(5), INSERTED.StartTime, 108) AS StartTime,
      CONVERT(VARCHAR(5), INSERTED.EndTime, 108) AS EndTime,
      INSERTED.Status,
      INSERTED.UpdatedAt
    WHERE CoachScheduleID = @CoachScheduleID
      AND CoachID = @CoachID
  `);

  return result.recordset[0] ?? null;
}

// ─── SCHEDULES: Delete (soft) schedule ───────────────────────

export async function deleteCoachSchedule(scheduleId: number, coachId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachScheduleID", sql.Int, scheduleId)
    .input("CoachID", sql.Int, coachId)
    .query(`
      UPDATE CoachSchedules
      SET Status = 'Cancelled', UpdatedAt = GETDATE()
      OUTPUT INSERTED.CoachScheduleID, INSERTED.Status
      WHERE CoachScheduleID = @CoachScheduleID
        AND CoachID = @CoachID
        AND Status = 'Available'
    `);

  return result.recordset[0] ?? null;
}

// ─── SCHEDULES: Find schedule by ID ──────────────────────────

export async function findScheduleById(scheduleId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachScheduleID", sql.Int, scheduleId)
    .query(`
      SELECT
        CoachScheduleID,
        CoachID,
        CONVERT(VARCHAR(10), WorkingDate, 120) AS WorkingDate,
        CONVERT(VARCHAR(5), StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), EndTime, 108) AS EndTime,
        Status
      FROM CoachSchedules
      WHERE CoachScheduleID = @CoachScheduleID
    `);

  return result.recordset[0] ?? null;
}

// ─── PUBLIC: Available schedules for booking ─────────────────

export async function findAvailableCoachSchedules(
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("WorkingDate", sql.Date, bookingDate)
    .input("StartTime", sql.VarChar(5), startTime)
    .input("EndTime", sql.VarChar(5), endTime)
    .query(`
      SELECT
        cs.CoachScheduleID,
        cs.CoachID,
        CONVERT(VARCHAR(10), cs.WorkingDate, 120) AS WorkingDate,
        CONVERT(VARCHAR(5), cs.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), cs.EndTime, 108) AS EndTime,
        cs.Status,
        c.HourlyRate,
        c.SkillLevel,
        c.Specialization,
        c.AverageRating,
        c.TotalStudents,
        u.FullName,
        u.AvatarURL
      FROM CoachSchedules cs
      INNER JOIN Coaches c ON cs.CoachID = c.CoachID
      INNER JOIN Users u ON c.UserID = u.UserID
      WHERE cs.WorkingDate = @WorkingDate
        AND cs.StartTime = CAST(@StartTime AS TIME)
        AND cs.EndTime = CAST(@EndTime AS TIME)
        AND cs.Status = 'Available'
        AND c.Status = 'Approved'
        AND u.Status = 'Active'
      ORDER BY c.AverageRating DESC, c.TotalStudents DESC
    `);

  return result.recordset;
}

// ─── ADMIN: Get all coaches ───────────────────────────────────

export async function findAllCoachesAdmin() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      c.CoachID,
      c.UserID,
      u.FullName,
      u.Email,
      u.PhoneNumber,
      u.AvatarURL,
      c.ExperienceYears,
      c.SkillLevel,
      c.Specialization,
      c.Certifications,
      c.HourlyRate,
      c.Biography,
      c.AverageRating,
      c.TotalStudents,
      c.Status,
      c.CreatedAt,
      c.UpdatedAt
    FROM Coaches c
    INNER JOIN Users u ON c.UserID = u.UserID
    ORDER BY c.CreatedAt DESC
  `);

  return result.recordset;
}

// ─── ADMIN: Get pending coaches ───────────────────────────────

export async function findPendingCoaches() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      c.CoachID,
      c.UserID,
      u.FullName,
      u.Email,
      u.PhoneNumber,
      u.AvatarURL,
      c.ExperienceYears,
      c.SkillLevel,
      c.Specialization,
      c.Certifications,
      c.HourlyRate,
      c.Biography,
      c.AverageRating,
      c.TotalStudents,
      c.Status,
      c.CreatedAt
    FROM Coaches c
    INNER JOIN Users u ON c.UserID = u.UserID
    WHERE c.Status = 'Pending'
    ORDER BY c.CreatedAt ASC
  `);

  return result.recordset;
}

// ─── ADMIN: Update coach status ───────────────────────────────

export async function updateCoachStatus(coachId: number, status: CoachStatus) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .input("Status", sql.NVarChar(30), status)
    .query(`
      UPDATE Coaches
      SET Status = @Status, UpdatedAt = GETDATE()
      OUTPUT
        INSERTED.CoachID,
        INSERTED.Status,
        INSERTED.UpdatedAt
      WHERE CoachID = @CoachID
    `);

  return result.recordset[0] ?? null;
}

// ─── HELPER: Find coach by CoachID (any status, admin use) ───

export async function findCoachByIdAdmin(coachId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .query(`
      SELECT
        c.CoachID,
        c.UserID,
        c.Status
      FROM Coaches c
      WHERE c.CoachID = @CoachID
    `);

  return result.recordset[0] ?? null;
}

export async function updateUserAvatar(userId: number, avatarUrl: string | null) {
  const pool = await getPool();
  await pool
    .request()
    .input("UserID", sql.Int, userId)
    .input("AvatarURL", sql.NVarChar(255), avatarUrl ?? null)
    .query(`
      UPDATE Users
      SET AvatarURL = @AvatarURL, UpdatedAt = GETDATE()
      WHERE UserID = @UserID
    `);
}

// ─── ADMIN: Create Coach Transaction ──────────────────────────

export async function createCoachAdminTransaction(
  data: import("./coaches.type").CreateCoachAdminInput & { passwordHash: string }
) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Get RoleID for Coach
    const roleReq = new sql.Request(transaction);
    const roleResult = await roleReq.query(`SELECT RoleID FROM Roles WHERE RoleName = 'Coach'`);
    const roleId = roleResult.recordset[0]?.RoleID;
    if (!roleId) throw new Error("Role Coach không tồn tại trong hệ thống");

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
    userReq.input("AvatarURL", sql.NVarChar(255), data.avatarUrl || null);
    userReq.input("Status", sql.NVarChar(30), "Active");

    const userResult = await userReq.query(`
      INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, AvatarURL, Status)
      OUTPUT INSERTED.UserID
      VALUES (@FullName, @Email, @PhoneNumber, @PasswordHash, @AvatarURL, @Status)
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

    // 5. Insert Coach
    const coachReq = new sql.Request(transaction);
    coachReq.input("UserID", sql.Int, userId);
    coachReq.input("ExperienceYears", sql.Int, data.experience);
    coachReq.input("SkillLevel", sql.NVarChar(30), data.skillLevel || null);
    coachReq.input("Specialization", sql.NVarChar(255), data.specialty || null);
    coachReq.input("Certifications", sql.NVarChar(255), data.certificate || null);
    coachReq.input("HourlyRate", sql.Decimal(18, 2), data.hourlyRate);
    coachReq.input("Biography", sql.NVarChar(sql.MAX), data.bio || null);
    coachReq.input("Status", sql.NVarChar(30), "Approved");

    await coachReq.query(`
      INSERT INTO Coaches (UserID, ExperienceYears, SkillLevel, Specialization, Certifications, HourlyRate, Biography, Status)
      VALUES (@UserID, @ExperienceYears, @SkillLevel, @Specialization, @Certifications, @HourlyRate, @Biography, @Status)
    `);

    await transaction.commit();
    return userId;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ─── INCOME: Calculate coach income from Bookings ──────────────

export async function findCoachIncome(coachId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .query(`
      SELECT
        b.BookingID,
        b.BookingType,
        u.FullName AS PlayerName,
        CONVERT(VARCHAR(10), bd.BookingDate, 120) AS WorkingDate,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime,
        bd.CoachFee,
        b.Status,
        DATEDIFF(MINUTE, bd.StartTime, bd.EndTime) / 60.0 AS WorkingHours,
        c.HourlyRate
      FROM BookingDetails bd
      INNER JOIN Bookings b ON bd.BookingID = b.BookingID
      INNER JOIN Users u ON b.UserID = u.UserID
      INNER JOIN Coaches c ON bd.CoachID = c.CoachID
      WHERE bd.CoachID = @CoachID
        AND b.BookingType IN ('Coach', 'Combo')
        AND b.Status = 'Completed'
      ORDER BY bd.BookingDate DESC, bd.StartTime DESC
    `);

  return result.recordset;
}
