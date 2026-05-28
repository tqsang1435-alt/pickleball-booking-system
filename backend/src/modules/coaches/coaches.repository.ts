import { getPool, sql } from "@/database/connection";

export async function findAllApprovedCoaches() {
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
      c.Status
    FROM Coaches c
    INNER JOIN Users u ON c.UserID = u.UserID
    WHERE c.Status = 'Approved'
      AND u.Status = 'Active'
    ORDER BY c.AverageRating DESC, c.TotalStudents DESC
  `);

  return result.recordset;
}

export async function findCoachById(coachId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .query(`
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
        c.Status
      FROM Coaches c
      INNER JOIN Users u ON c.UserID = u.UserID
      WHERE c.CoachID = @CoachID
    `);

  return result.recordset[0] ?? null;
}

export async function findCoachSchedules(coachId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .query(`
      SELECT
        CoachScheduleID,
        CoachID,
        WorkingDate,
        CONVERT(VARCHAR(5), StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), EndTime, 108) AS EndTime,
        Status,
        HoldUntil,
        CreatedAt,
        UpdatedAt
      FROM CoachSchedules
      WHERE CoachID = @CoachID
      ORDER BY WorkingDate ASC, StartTime ASC
    `);

  return result.recordset;
}

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
      INSERT INTO CoachSchedules (
        CoachID,
        WorkingDate,
        StartTime,
        EndTime,
        Status
      )
      OUTPUT
        INSERTED.CoachScheduleID,
        INSERTED.CoachID,
        INSERTED.WorkingDate,
        CONVERT(VARCHAR(5), INSERTED.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), INSERTED.EndTime, 108) AS EndTime,
        INSERTED.Status
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
        cs.WorkingDate,
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

      ORDER BY
        c.AverageRating DESC,
        c.TotalStudents DESC
    `);

  return result.recordset;
}
