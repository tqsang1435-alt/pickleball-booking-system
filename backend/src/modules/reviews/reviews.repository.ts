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

export async function findCoachReviews(coachId: number, page: number = 1, limit: number = 10) {
  const pool = await getPool();
  const offset = (page - 1) * limit;

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .input("Offset", sql.Int, offset)
    .input("Limit", sql.Int, limit)
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
      ORDER BY r.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countCoachReviews(coachId: number) {
  const pool = await getPool();
  const result = await pool.request().input("CoachID", sql.Int, coachId).query(`
    SELECT COUNT(*) as Total FROM Reviews WHERE CoachID = @CoachID AND Status = 'Visible'
  `);
  return result.recordset[0].Total;
}

export async function findCourtReviews(courtId: number, page: number = 1, limit: number = 10) {
  const pool = await getPool();
  const offset = (page - 1) * limit;

  const result = await pool
    .request()
    .input("CourtID", sql.Int, courtId)
    .input("Offset", sql.Int, offset)
    .input("Limit", sql.Int, limit)
    .query(`
      SELECT
        r.ReviewID,
        r.BookingID,
        r.UserID,
        r.CourtID,
        r.Rating,
        r.Comment,
        r.Status,
        r.CreatedAt,
        u.FullName,
        u.AvatarURL
      FROM Reviews r
      INNER JOIN Users u ON r.UserID = u.UserID
      WHERE r.CourtID = @CourtID
        AND r.Status = 'Visible'
      ORDER BY r.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countCourtReviews(courtId: number) {
  const pool = await getPool();
  const result = await pool.request().input("CourtID", sql.Int, courtId).query(`
    SELECT COUNT(*) as Total FROM Reviews WHERE CourtID = @CourtID AND Status = 'Visible'
  `);
  return result.recordset[0].Total;
}

export async function findClubReviews(page: number = 1, limit: number = 10) {
  const pool = await getPool();
  const offset = (page - 1) * limit;

  const result = await pool
    .request()
    .input("Offset", sql.Int, offset)
    .input("Limit", sql.Int, limit)
    .query(`
      SELECT
        r.ReviewID,
        r.BookingID,
        r.UserID,
        r.Rating,
        r.Comment,
        r.Status,
        r.CreatedAt,
        u.FullName,
        u.AvatarURL
      FROM Reviews r
      INNER JOIN Users u ON r.UserID = u.UserID
      WHERE r.CourtID IS NULL AND r.CoachID IS NULL
        AND r.Status = 'Visible'
      ORDER BY r.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countClubReviews() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT COUNT(*) as Total FROM Reviews WHERE CourtID IS NULL AND CoachID IS NULL AND Status = 'Visible'
  `);
  return result.recordset[0].Total;
}

export async function findMyReviews(userId: number, page: number = 1, limit: number = 10) {
  const pool = await getPool();
  const offset = (page - 1) * limit;

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .input("Offset", sql.Int, offset)
    .input("Limit", sql.Int, limit)
    .query(`
      SELECT
        r.ReviewID,
        r.BookingID,
        r.UserID,
        r.CourtID,
        r.CoachID,
        r.Rating,
        r.Comment,
        r.Status,
        r.CreatedAt,
        c.CourtName,
        u.FullName as CoachName
      FROM Reviews r
      LEFT JOIN Courts c ON r.CourtID = c.CourtID
      LEFT JOIN Coaches co ON r.CoachID = co.CoachID
      LEFT JOIN Users u ON co.UserID = u.UserID
      WHERE r.UserID = @UserID
      ORDER BY r.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  return result.recordset;
}

export async function countMyReviews(userId: number) {
  const pool = await getPool();
  const result = await pool.request().input("UserID", sql.Int, userId).query(`
    SELECT COUNT(*) as Total FROM Reviews WHERE UserID = @UserID
  `);
  return result.recordset[0].Total;
}

export async function getReviewStats(type: 'court' | 'coach' | 'club', id?: number) {
  const pool = await getPool();
  let whereClause = "r.Status = 'Visible'";
  
  const req = pool.request();
  
  if (type === 'court') {
    whereClause += " AND r.CourtID = @ID";
    req.input("ID", sql.Int, id);
  } else if (type === 'coach') {
    whereClause += " AND r.CoachID = @ID";
    req.input("ID", sql.Int, id);
  } else if (type === 'club') {
    whereClause += " AND r.CourtID IS NULL AND r.CoachID IS NULL";
  }

  const result = await req.query(`
    SELECT 
      COUNT(*) as TotalReviews,
      ISNULL(AVG(CAST(r.Rating AS FLOAT)), 0) as AverageRating,
      SUM(CASE WHEN r.Rating = 5 THEN 1 ELSE 0 END) as Star5,
      SUM(CASE WHEN r.Rating = 4 THEN 1 ELSE 0 END) as Star4,
      SUM(CASE WHEN r.Rating = 3 THEN 1 ELSE 0 END) as Star3,
      SUM(CASE WHEN r.Rating = 2 THEN 1 ELSE 0 END) as Star2,
      SUM(CASE WHEN r.Rating = 1 THEN 1 ELSE 0 END) as Star1
    FROM Reviews r
    WHERE ${whereClause}
  `);

  return result.recordset[0];
}

export async function getClubGlobalStats() {
  const pool = await getPool();
  // Average from all visible reviews (Court + Coach + Club)
  const result = await pool.request().query(`
    SELECT 
      COUNT(*) as TotalReviews,
      ISNULL(AVG(CAST(r.Rating AS FLOAT)), 0) as AverageRating,
      SUM(CASE WHEN r.Rating = 5 THEN 1 ELSE 0 END) as Star5,
      SUM(CASE WHEN r.Rating = 4 THEN 1 ELSE 0 END) as Star4,
      SUM(CASE WHEN r.Rating = 3 THEN 1 ELSE 0 END) as Star3,
      SUM(CASE WHEN r.Rating = 2 THEN 1 ELSE 0 END) as Star2,
      SUM(CASE WHEN r.Rating = 1 THEN 1 ELSE 0 END) as Star1
    FROM Reviews r
    WHERE r.Status = 'Visible'
  `);
  return result.recordset[0];
}

export async function checkBookingReviewed(bookingId: number) {
  const pool = await getPool();
  const result = await pool.request().input("BookingID", sql.Int, bookingId).query(`
    SELECT TOP 1 ReviewID FROM Reviews WHERE BookingID = @BookingID
  `);
  return result.recordset.length > 0;
}

export async function getBookingInfoForReview(bookingId: number, userId: number) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT b.BookingID, b.Status, bd.CourtID, bd.CoachID
      FROM Bookings b
      LEFT JOIN BookingDetails bd ON b.BookingID = bd.BookingID
      WHERE b.BookingID = @BookingID AND b.UserID = @UserID
    `);
  
  if (result.recordset.length === 0) return null;
  
  // Aggregate since multiple details can exist
  const booking = result.recordset[0];
  const courtId = result.recordset.find(r => r.CourtID)?.CourtID || null;
  const coachId = result.recordset.find(r => r.CoachID)?.CoachID || null;
  
  return {
    BookingID: booking.BookingID,
    Status: booking.Status,
    CourtID: courtId,
    CoachID: coachId
  };
}

export async function findUnreviewedCompletedBooking(userId: number, courtId?: number, coachId?: number) {
  const pool = await getPool();
  
  let query = `
    SELECT TOP 1 b.BookingID 
    FROM Bookings b
    LEFT JOIN Reviews r ON b.BookingID = r.BookingID
    LEFT JOIN BookingDetails bd ON bd.BookingID = b.BookingID
    WHERE b.UserID = @UserID AND b.Status = 'Completed' AND r.ReviewID IS NULL
  `;
  
  if (courtId) query += " AND bd.CourtID = @CourtID";
  if (coachId) query += " AND bd.CoachID = @CoachID";
  
  query += " ORDER BY b.BookingDate DESC";

  const req = pool.request().input("UserID", sql.Int, userId);
  if (courtId) req.input("CourtID", sql.Int, courtId);
  if (coachId) req.input("CoachID", sql.Int, coachId);

  const result = await req.query(query);
  
  if (result.recordset.length === 0) return null;
  return result.recordset[0].BookingID;
}

export async function createReview(data: {
  bookingId: number;
  userId: number;
  courtId: number | null;
  coachId: number | null;
  rating: number;
  comment: string;
}) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("BookingID", sql.Int, data.bookingId)
    .input("UserID", sql.Int, data.userId)
    .input("CourtID", sql.Int, data.courtId)
    .input("CoachID", sql.Int, data.coachId)
    .input("Rating", sql.Int, data.rating)
    .input("Comment", sql.NVarChar, data.comment)
    .query(`
      INSERT INTO Reviews (BookingID, UserID, CourtID, CoachID, Rating, Comment, Status, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@BookingID, @UserID, @CourtID, @CoachID, @Rating, @Comment, 'Visible', GETDATE())
    `);
    
  return result.recordset[0];
}