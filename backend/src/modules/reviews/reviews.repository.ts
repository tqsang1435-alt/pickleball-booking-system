import { getPool } from "@/database/connection";

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
