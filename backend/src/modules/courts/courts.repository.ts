import { getPool, sql } from "@/database/connection";

export async function findAllCourts() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      CourtID,
      CourtCode,
      CourtName,
      CourtType,
      Location,
      Description,
      PricePerHour,
      CourtImage,
      Status,
      CONVERT(VARCHAR(5), OpenTime, 108) AS OpenTime,
      CONVERT(VARCHAR(5), CloseTime, 108) AS CloseTime,
      CreatedAt,
      UpdatedAt
    FROM Courts
    WHERE Status <> 'Inactive'
    ORDER BY CourtID ASC
  `);

  return result.recordset;
}

export async function findCourtById(courtId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CourtID", sql.Int, courtId)
    .query(`
      SELECT
        CourtID,
        CourtCode,
        CourtName,
        CourtType,
        Location,
        Description,
        PricePerHour,
        CourtImage,
        Status,
        CONVERT(VARCHAR(5), OpenTime, 108) AS OpenTime,
        CONVERT(VARCHAR(5), CloseTime, 108) AS CloseTime,
        CreatedAt,
        UpdatedAt
      FROM Courts
      WHERE CourtID = @CourtID
    `);

  return result.recordset[0] ?? null;
}

export async function findAvailableCourts(
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("SlotDate", sql.Date, bookingDate)
    .input("StartTime", sql.VarChar(5), startTime)
    .input("EndTime", sql.VarChar(5), endTime)
    .query(`
      SELECT
        c.CourtID,
        c.CourtCode,
        c.CourtName,
        c.CourtType,
        c.Location,
        c.Description,
        c.PricePerHour,
        c.CourtImage,
        c.Status AS CourtStatus,

        cs.SlotID,
        cs.SlotDate,
        CONVERT(VARCHAR(5), cs.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), cs.EndTime, 108) AS EndTime,
        cs.Price,
        cs.Status AS SlotStatus

      FROM CourtSlots cs
      INNER JOIN Courts c ON cs.CourtID = c.CourtID
      WHERE cs.SlotDate = @SlotDate
        AND cs.StartTime = CAST(@StartTime AS TIME)
        AND cs.EndTime = CAST(@EndTime AS TIME)
        AND cs.Status = 'Available'
        AND c.Status = 'Available'
      ORDER BY c.CourtID ASC
    `);

  return result.recordset;
}

export async function findCourtSlots(courtId: number, slotDate: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CourtID", sql.Int, courtId)
    .input("SlotDate", sql.Date, slotDate)
    .query(`
      SELECT
        SlotID,
        CourtID,
        SlotDate,
        CONVERT(VARCHAR(5), StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), EndTime, 108) AS EndTime,
        Price,
        Status,
        HoldUntil,
        CreatedAt,
        UpdatedAt
      FROM CourtSlots
      WHERE CourtID = @CourtID
        AND SlotDate = @SlotDate
      ORDER BY StartTime ASC
    `);

  return result.recordset;
}

export async function createCourtSlot(data: {
  courtId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  price: number;
}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CourtID", sql.Int, data.courtId)
    .input("SlotDate", sql.Date, data.slotDate)
    .input("StartTime", sql.VarChar(5), data.startTime)
    .input("EndTime", sql.VarChar(5), data.endTime)
    .input("Price", sql.Decimal(18, 2), data.price)
    .query(`
      INSERT INTO CourtSlots (
        CourtID,
        SlotDate,
        StartTime,
        EndTime,
        Price,
        Status
      )
      OUTPUT
        INSERTED.SlotID,
        INSERTED.CourtID,
        INSERTED.SlotDate,
        CONVERT(VARCHAR(5), INSERTED.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), INSERTED.EndTime, 108) AS EndTime,
        INSERTED.Price,
        INSERTED.Status
      VALUES (
        @CourtID,
        @SlotDate,
        CAST(@StartTime AS TIME),
        CAST(@EndTime AS TIME),
        @Price,
        'Available'
      )
    `);

  return result.recordset[0];
}