import { getPool, sql } from "@/database/connection";

export interface BookingRecord {
  CourtID: number;
  BookingDate: string;
  StartTime: string;
  EndTime: string;
  Status: string;
}

export interface OccupancyForecast {
  CourtID: number;
  ForecastDate: string;
  HourStart: number;
  PredictedRate: number;
  ModelVersion: string;
}

export interface PromotionRecommendation {
  TargetDate: string;
  TargetHourRange: string;
  SuggestedDiscount: number;
  Reasoning: string;
  MarketingMessage: string;
  Status?: string;
}

/**
 * Retrieve all valid historical bookings for court occupancy model training.
 * Excludes cancelled and noshow bookings.
 */
export async function getHistoricalBookings(): Promise<BookingRecord[]> {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT 
      bd.CourtID, 
      CONVERT(VARCHAR(10), bd.BookingDate, 120) AS BookingDate, 
      CONVERT(VARCHAR(8), bd.StartTime) AS StartTime, 
      CONVERT(VARCHAR(8), bd.EndTime) AS EndTime, 
      b.Status
    FROM BookingDetails bd
    JOIN Bookings b ON bd.BookingID = b.BookingID
    WHERE b.Status IN ('Paid', 'Confirmed', 'CheckedIn', 'Completed')
  `);
  return result.recordset;
}

/**
 * Get all active court IDs.
 */
export async function getAllCourtIds(): Promise<number[]> {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT CourtID FROM Courts WHERE Status = 'Active' OR Status = 'Available'
  `);
  return result.recordset.map(row => row.CourtID);
}

/**
 * Save newly computed forecasts to AIOccupancyForecasts.
 */
export async function saveOccupancyForecasts(forecasts: OccupancyForecast[]): Promise<void> {
  if (forecasts.length === 0) return;
  const pool = await getPool();
  
  // Clean forecasts for the target dates to avoid duplication
  const targetDates = Array.from(new Set(forecasts.map(f => f.ForecastDate)));
  for (const date of targetDates) {
    await pool.request()
      .input("TargetDate", sql.Date, date)
      .query("DELETE FROM AIOccupancyForecasts WHERE ForecastDate = @TargetDate");
  }

  // Insert predictions
  for (const f of forecasts) {
    await pool.request()
      .input("CourtID", sql.Int, f.CourtID)
      .input("ForecastDate", sql.Date, f.ForecastDate)
      .input("HourStart", sql.Int, f.HourStart)
      .input("PredictedRate", sql.Decimal(5, 2), f.PredictedRate)
      .input("ModelVersion", sql.NVarChar(50), f.ModelVersion)
      .query(`
        INSERT INTO AIOccupancyForecasts (CourtID, ForecastDate, HourStart, PredictedRate, ModelVersion)
        VALUES (@CourtID, @ForecastDate, @HourStart, @PredictedRate, @ModelVersion)
      `);
  }
}

/**
 * Save computed promotion recommendations.
 */
export async function savePromotionRecommendations(recs: PromotionRecommendation[], targetDate: string): Promise<void> {
  const pool = await getPool();

  // Delete existing suggested promotions for this date to allow overwrite/regenerations
  await pool.request()
    .input("TargetDate", sql.Date, targetDate)
    .query("DELETE FROM AIPromotionRecommendations WHERE TargetDate = @TargetDate AND Status = 'Suggested'");

  if (recs.length === 0) return;

  for (const r of recs) {
    await pool.request()
      .input("TargetDate", sql.Date, r.TargetDate)
      .input("TargetHourRange", sql.NVarChar(50), r.TargetHourRange)
      .input("SuggestedDiscount", sql.Decimal(5, 2), r.SuggestedDiscount)
      .input("Reasoning", sql.NVarChar(sql.MAX), r.Reasoning)
      .input("MarketingMessage", sql.NVarChar(sql.MAX), r.MarketingMessage)
      .query(`
        INSERT INTO AIPromotionRecommendations (TargetDate, TargetHourRange, SuggestedDiscount, Reasoning, MarketingMessage, Status)
        VALUES (@TargetDate, @TargetHourRange, @SuggestedDiscount, @Reasoning, @MarketingMessage, 'Suggested')
      `);
  }
}

/**
 * Get occupancy forecasts for a specific date.
 */
export async function getOccupancyForecasts(date: string) {
  const pool = await getPool();
  const result = await pool.request()
    .input("ForecastDate", sql.Date, date)
    .query(`
      SELECT ForecastID, CourtID, CONVERT(VARCHAR(10), ForecastDate, 120) AS ForecastDate, HourStart, PredictedRate, ModelVersion, CreatedAt
      FROM AIOccupancyForecasts
      WHERE ForecastDate = @ForecastDate
      ORDER BY HourStart, CourtID
    `);
  return result.recordset;
}

/**
 * Get promotion recommendations for a specific date.
 */
export async function getPromotionRecommendations(date: string) {
  const pool = await getPool();
  const result = await pool.request()
    .input("TargetDate", sql.Date, date)
    .query(`
      SELECT RecommendationID, CONVERT(VARCHAR(10), TargetDate, 120) AS TargetDate, TargetHourRange, SuggestedDiscount, DiscountType, Reasoning, MarketingMessage, Status, CreatedAt, UpdatedAt
      FROM AIPromotionRecommendations
      WHERE TargetDate = @TargetDate
      ORDER BY TargetHourRange
    `);
  return result.recordset;
}

/**
 * Update promotion recommendation status.
 */
export async function updateRecommendationStatus(id: number, status: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool.request()
    .input("RecommendationID", sql.Int, id)
    .input("Status", sql.NVarChar(30), status)
    .query(`
      UPDATE AIPromotionRecommendations
      SET Status = @Status, UpdatedAt = GETDATE()
      WHERE RecommendationID = @RecommendationID
    `);
  return (result.rowsAffected[0] ?? 0) > 0;
}

/**
 * Log details about AI invocations, latency and forecasting metrics.
 */
export async function logAIRequest(
  requestType: string,
  latencyMs: number,
  inputPayload: string,
  outputPayload: string,
  actualRate?: number,
  forecastError?: number
): Promise<void> {
  const pool = await getPool();
  await pool.request()
    .input("RequestType", sql.NVarChar(50), requestType)
    .input("LatencyMs", sql.Int, latencyMs)
    .input("InputPayload", sql.NVarChar(sql.MAX), inputPayload)
    .input("OutputPayload", sql.NVarChar(sql.MAX), outputPayload)
    .input("ActualRate", sql.Decimal(5, 2), actualRate !== null && actualRate !== undefined ? actualRate : null)
    .input("ForecastError", sql.Decimal(5, 2), forecastError !== null && forecastError !== undefined ? forecastError : null)
    .query(`
      INSERT INTO AIModelLogs (RequestType, LatencyMs, InputPayload, OutputPayload, ActualRate, ForecastError)
      VALUES (@RequestType, @LatencyMs, @InputPayload, @OutputPayload, @ActualRate, @ForecastError)
    `);
}

/**
 * Get AI model request logs.
 */
export async function getAIModelLogs(limit: number = 100) {
  const pool = await getPool();
  const result = await pool.request()
    .input("Limit", sql.Int, limit)
    .query(`
      SELECT TOP (@Limit) LogID, RequestType, LatencyMs, InputPayload, OutputPayload, ActualRate, ForecastError, CreatedAt
      FROM AIModelLogs
      ORDER BY CreatedAt DESC
    `);
  return result.recordset;
}

/**
 * Fetch historical forecast vs actual comparisons to determine accuracy metrics.
 */
export async function getUnevaluatedForecasts(maxDate: string) {
  const pool = await getPool();
  const result = await pool.request()
    .input("MaxDate", sql.Date, maxDate)
    .query(`
      SELECT f.ForecastID, f.CourtID, CONVERT(VARCHAR(10), f.ForecastDate, 120) AS ForecastDate, f.HourStart, f.PredictedRate
      FROM AIOccupancyForecasts f
      LEFT JOIN AIModelLogs l ON l.RequestType = CONCAT('evaluation_', f.ForecastID)
      WHERE f.ForecastDate <= @MaxDate AND l.LogID IS NULL
    `);
  return result.recordset;
}

/**
 * Check actual booking status for a specific court slot.
 * Returns 100 if booked (1), 0 otherwise (0).
 */
export async function checkActualSlotOccupied(courtId: number, dateStr: string, hourStart: number): Promise<number> {
  const pool = await getPool();
  const result = await pool.request()
    .input("CourtID", sql.Int, courtId)
    .input("BookingDate", sql.Date, dateStr)
    .input("HourStart", sql.Int, hourStart)
    .query(`
      SELECT COUNT(*) AS SlotCount
      FROM BookingDetails bd
      JOIN Bookings b ON bd.BookingID = b.BookingID
      WHERE bd.CourtID = @CourtID 
        AND bd.BookingDate = @BookingDate
        AND @HourStart >= DATEPART(HOUR, bd.StartTime) 
        AND @HourStart < DATEPART(HOUR, bd.EndTime)
        AND b.Status IN ('Paid', 'Confirmed', 'CheckedIn', 'Completed')
    `);
  
  const count = result.recordset[0]?.SlotCount ?? 0;
  return count > 0 ? 100.0 : 0.0;
}

/**
 * Fetch recommendation details by ID.
 */
export async function findRecommendationById(id: number) {
  const pool = await getPool();
  const result = await pool.request()
    .input("RecommendationID", sql.Int, id)
    .query(`
      SELECT RecommendationID, CONVERT(VARCHAR(10), TargetDate, 120) AS TargetDate, TargetHourRange, SuggestedDiscount, DiscountType, Reasoning, MarketingMessage, Status
      FROM AIPromotionRecommendations
      WHERE RecommendationID = @RecommendationID
    `);
  return result.recordset[0] ?? null;
}

/**
 * Automatically create an Inactive (Scheduled) voucher code in Promotions table.
 * Strictly clamps discount to max 50% for security.
 */
export async function createActivePromotionFromRecommendation(
  rec: any,
  adminId?: number
): Promise<string> {
  const pool = await getPool();

  // Parse hours from "16:00-17:00"
  const rangeMatch = rec.TargetHourRange.match(/(\d{1,2}):\d{2}-(\d{1,2}):\d{2}/);
  const startHour = rangeMatch ? parseInt(rangeMatch[1], 10) : 9;
  const endHour = rangeMatch ? parseInt(rangeMatch[2], 10) : 10;

  const dateCompact = rec.TargetDate.replace(/-/g, "");
  const promoCode = `AI_HH_${dateCompact}_${startHour}H`;
  const promoName = `Happy Hour AI - Sân Tất cả - Khung giờ ${rec.TargetHourRange}`;

  // Clamped discount value to 50% max
  const discountValue = Math.min(Number(rec.SuggestedDiscount), 50.0);

  // Check if already created
  const existingCheck = await pool.request()
    .input("Code", sql.NVarChar(50), promoCode)
    .query("SELECT PromotionID FROM Promotions WHERE PromotionCode = @Code");

  if (existingCheck.recordset.length > 0) {
    return promoCode;
  }

  // Insert as Inactive (equivalent to Scheduled)
  await pool.request()
    .input("Code", sql.NVarChar(50), promoCode)
    .input("Name", sql.NVarChar(100), promoName)
    .input("Description", sql.NVarChar(sql.MAX), rec.Reasoning)
    .input("DiscountType", sql.NVarChar(20), "Percent")
    .input("DiscountValue", sql.Decimal(18, 2), discountValue)
    .input("StartDate", sql.Date, rec.TargetDate)
    .input("EndDate", sql.Date, rec.TargetDate)
    .input("Status", sql.NVarChar(30), "Inactive") // Initial Scheduled status
    .input("CreatedBy", sql.Int, adminId || 1)
    .input("TargetHourStart", sql.Int, startHour)
    .input("TargetHourEnd", sql.Int, endHour)
    .input("TargetDate", sql.Date, rec.TargetDate)
    .query(`
      INSERT INTO Promotions (
        PromotionCode, PromotionName, Description, DiscountType, DiscountValue, 
        MinOrderAmount, UsageLimit, UsedCount, PerUserLimit, ApplyScope, 
        StartDate, EndDate, Status, CreatedBy, TargetHourStart, TargetHourEnd, TargetDate
      ) VALUES (
        @Code, @Name, @Description, @DiscountType, @DiscountValue, 
        0, null, 0, 1, 'Public', 
        @StartDate, @EndDate, @Status, @CreatedBy, @TargetHourStart, @TargetHourEnd, @TargetDate
      )
    `);

  return promoCode;
}
