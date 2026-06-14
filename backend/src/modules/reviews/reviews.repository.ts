import { getPool, sql } from "@/database/connection";

export async function findPublicReviews(limit = 6) {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT TOP ${limit}
      r.ReviewID,
      r.Rating,
      r.Comment,
      r.CreatedAt,
      u.FullName,
      u.AvatarURL,
      c.CourtName,
      co.UserID AS CoachUserID
    FROM Reviews r
    INNER JOIN Users u ON r.UserID = u.UserID
    LEFT JOIN Courts c ON r.CourtID = c.CourtID
    LEFT JOIN Coaches co ON r.CoachID = co.CoachID
    WHERE r.Status = 'Visible'
      AND r.Comment IS NOT NULL
      AND LEN(r.Comment) > 5
    ORDER BY r.CreatedAt DESC
  `);

  return result.recordset;
}

export async function findCoachReviews(coachId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .query(`
      SELECT
        r.ReviewID,
        r.BookingID,
        r.UserID,
        r.CoachID,
        r.Rating,
        r.Comment,
        r.Status,
        r.CreatedAt,
        u.FullName,
        u.AvatarURL
      FROM Reviews r
      INNER JOIN Users u ON r.UserID = u.UserID
      WHERE r.CoachID = @CoachID
        AND r.Status = 'Visible'
        AND r.Comment IS NOT NULL
        AND LEN(r.Comment) > 0
      ORDER BY r.CreatedAt DESC
    `);

  return result.recordset;
}