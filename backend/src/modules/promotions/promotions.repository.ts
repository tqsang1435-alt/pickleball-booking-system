// ==========================================
// promotions.repository.ts
// All DB queries for Promotion module
// ==========================================

import { getPool, sql } from "@/database/connection";
import type { CreatePromotionInput, UpdatePromotionInput } from "./promotions.type";

// ── Read Promotions ──────────────────────────────────────────────────────────

export async function findAllPromotions() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      PromotionID, PromotionCode, PromotionName, Description,
      DiscountType, DiscountValue, MaxDiscountAmount, MinOrderAmount,
      UsageLimit, UsedCount, PerUserLimit, ApplyScope,
      StartDate, EndDate, Status, CreatedBy, CreatedAt, UpdatedAt
    FROM Promotions
    WHERE Status = 'Active'
    ORDER BY PromotionID DESC
  `);
  return result.recordset;
}

export async function findPromotionById(promotionId: number) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("PromotionID", sql.Int, promotionId)
    .query(`
      SELECT
        PromotionID, PromotionCode, PromotionName, Description,
        DiscountType, DiscountValue, MaxDiscountAmount, MinOrderAmount,
        UsageLimit, UsedCount, PerUserLimit, ApplyScope,
        StartDate, EndDate, Status, CreatedBy, CreatedAt, UpdatedAt
      FROM Promotions
      WHERE PromotionID = @PromotionID
    `);
  return result.recordset[0] ?? null;
}

export async function findPromotionByCode(code: string) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Code", sql.NVarChar(50), code)
    .query(`
      SELECT
        PromotionID, PromotionCode, PromotionName, Description,
        DiscountType, DiscountValue, MaxDiscountAmount, MinOrderAmount,
        UsageLimit, UsedCount, PerUserLimit, ApplyScope,
        StartDate, EndDate, Status, CreatedBy, CreatedAt, UpdatedAt,
        TargetCourtID, TargetHourStart, TargetHourEnd, TargetDate
      FROM Promotions
      WHERE PromotionCode = @Code
    `);
  return result.recordset[0] ?? null;
}

export async function findActivePublicPromotions(bookingAmount?: number) {
  const pool = await getPool();
  const today = new Date().toISOString().split("T")[0];
  let query = `
    SELECT
      PromotionID, PromotionCode, PromotionName, Description,
      DiscountType, DiscountValue, MaxDiscountAmount, MinOrderAmount,
      UsageLimit, UsedCount, PerUserLimit, ApplyScope,
      StartDate, EndDate, Status, CreatedAt
    FROM Promotions
    WHERE Status = 'Active'
      AND ApplyScope = 'Public'
      AND StartDate <= @Today
      AND EndDate >= @Today
      AND (UsageLimit IS NULL OR UsedCount < UsageLimit)
  `;
  const req = pool.request().input("Today", sql.Date, today);

  if (bookingAmount !== undefined) {
    query += ` AND MinOrderAmount <= @Amount`;
    req.input("Amount", sql.Decimal(18, 2), bookingAmount);
  }

  query += ` ORDER BY DiscountValue DESC`;
  const result = await req.query(query);
  return result.recordset;
}

export async function findUserPrivatePromotions(userId: number, bookingAmount?: number) {
  const pool = await getPool();
  const today = new Date().toISOString().split("T")[0];
  let query = `
    SELECT
      p.PromotionID, p.PromotionCode, p.PromotionName, p.Description,
      p.DiscountType, p.DiscountValue, p.MaxDiscountAmount, p.MinOrderAmount,
      p.UsageLimit, p.UsedCount, p.PerUserLimit, p.ApplyScope,
      p.StartDate, p.EndDate, p.Status,
      up.Status AS UserPromotionStatus
    FROM Promotions p
    INNER JOIN UserPromotions up ON p.PromotionID = up.PromotionID
    WHERE up.UserID = @UserID
      AND up.Status = 'Assigned'
      AND p.Status = 'Active'
      AND p.StartDate <= @Today
      AND p.EndDate >= @Today
      AND (p.UsageLimit IS NULL OR p.UsedCount < p.UsageLimit)
  `;
  const req = pool
    .request()
    .input("UserID", sql.Int, userId)
    .input("Today", sql.Date, today);

  if (bookingAmount !== undefined) {
    query += ` AND p.MinOrderAmount <= @Amount`;
    req.input("Amount", sql.Decimal(18, 2), bookingAmount);
  }

  query += ` ORDER BY p.DiscountValue DESC`;
  const result = await req.query(query);
  return result.recordset;
}

export async function countUserPromotionUsages(promotionId: number, userId: number) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("PromotionID", sql.Int, promotionId)
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT COUNT(*) AS cnt
      FROM PromotionUsages
      WHERE PromotionID = @PromotionID
        AND UserID = @UserID
        AND Status = 'Used'
    `);
  return (result.recordset[0]?.cnt as number) ?? 0;
}

export async function findPromotionUsageByBooking(bookingId: number) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      SELECT * FROM PromotionUsages WHERE BookingID = @BookingID
    `);
  return result.recordset[0] ?? null;
}

// ── Admin Read ───────────────────────────────────────────────────────────────

export async function findAdminPromotions(filters: {
  status?: string;
  applyScope?: string;
  discountType?: string;
  keyword?: string;
}) {
  const pool = await getPool();
  let query = `
    SELECT
      PromotionID, PromotionCode, PromotionName, Description,
      DiscountType, DiscountValue, MaxDiscountAmount, MinOrderAmount,
      UsageLimit, UsedCount, PerUserLimit, ApplyScope,
      StartDate, EndDate, Status, CreatedBy, CreatedAt, UpdatedAt
    FROM Promotions
    WHERE 1=1
  `;
  const req = pool.request();

  if (filters.status) {
    query += ` AND Status = @Status`;
    req.input("Status", sql.NVarChar(30), filters.status);
  }
  if (filters.applyScope) {
    query += ` AND ApplyScope = @ApplyScope`;
    req.input("ApplyScope", sql.NVarChar(20), filters.applyScope);
  }
  if (filters.discountType) {
    query += ` AND DiscountType = @DiscountType`;
    req.input("DiscountType", sql.NVarChar(20), filters.discountType);
  }
  if (filters.keyword) {
    query += ` AND (PromotionCode LIKE @Keyword OR PromotionName LIKE @Keyword)`;
    req.input("Keyword", sql.NVarChar(200), `%${filters.keyword}%`);
  }

  query += ` ORDER BY PromotionID DESC`;
  const result = await req.query(query);
  return result.recordset;
}

export async function findPromotionUsers(promotionId: number) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("PromotionID", sql.Int, promotionId)
    .query(`
      SELECT
        up.UserPromotionID, up.UserID, up.Status, up.AssignedAt, up.UsedAt,
        u.FullName, u.Email, u.PhoneNumber
      FROM UserPromotions up
      INNER JOIN Users u ON up.UserID = u.UserID
      WHERE up.PromotionID = @PromotionID
        AND up.Status != 'Revoked'
      ORDER BY up.AssignedAt DESC
    `);
  return result.recordset;
}

export async function searchUsersForAdmin(keyword: string) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Keyword", sql.NVarChar(200), `%${keyword}%`)
    .query(`
      SELECT TOP 20
        u.UserID, u.FullName, u.Email, u.PhoneNumber, u.Status,
        r.RoleName
      FROM Users u
      LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
      LEFT JOIN Roles r ON ur.RoleID = r.RoleID
      WHERE u.Status = 'Active'
        AND (u.FullName LIKE @Keyword OR u.Email LIKE @Keyword OR u.PhoneNumber LIKE @Keyword)
      ORDER BY u.FullName
    `);
  return result.recordset;
}

// ── Write Promotions ─────────────────────────────────────────────────────────

export async function repoCreatePromotion(
  input: CreatePromotionInput,
  createdBy: number
): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Code", sql.NVarChar(50), input.promotionCode)
    .input("Name", sql.NVarChar(100), input.promotionName)
    .input("Description", sql.NVarChar(500), input.description ?? null)
    .input("DiscountType", sql.NVarChar(20), input.discountType)
    .input("DiscountValue", sql.Decimal(18, 2), input.discountValue)
    .input("MaxDiscountAmount", sql.Decimal(18, 2), input.maxDiscountAmount ?? null)
    .input("MinOrderAmount", sql.Decimal(18, 2), input.minBookingAmount ?? 0)
    .input("UsageLimit", sql.Int, input.usageLimit ?? null)
    .input("PerUserLimit", sql.Int, input.perUserLimit ?? 1)
    .input("ApplyScope", sql.NVarChar(20), input.applyScope)
    .input("StartDate", sql.Date, input.startDate)
    .input("EndDate", sql.Date, input.endDate)
    .input("Status", sql.NVarChar(30), input.status ?? "Active")
    .input("CreatedBy", sql.Int, createdBy)
    .query(`
      INSERT INTO Promotions
        (PromotionCode, PromotionName, Description, DiscountType, DiscountValue,
         MaxDiscountAmount, MinOrderAmount, UsageLimit, UsedCount, PerUserLimit,
         ApplyScope, StartDate, EndDate, Status, CreatedBy)
      OUTPUT INSERTED.PromotionID
      VALUES
        (@Code, @Name, @Description, @DiscountType, @DiscountValue,
         @MaxDiscountAmount, @MinOrderAmount, @UsageLimit, 0, @PerUserLimit,
         @ApplyScope, @StartDate, @EndDate, @Status, @CreatedBy)
    `);
  return result.recordset[0].PromotionID as number;
}

export async function repoUpdatePromotion(id: number, input: UpdatePromotionInput) {
  const pool = await getPool();
  const setClauses: string[] = ["UpdatedAt = GETDATE()"];
  const req = pool.request().input("ID", sql.Int, id);

  if (input.promotionName !== undefined) {
    setClauses.push("PromotionName = @Name");
    req.input("Name", sql.NVarChar(100), input.promotionName);
  }
  if (input.description !== undefined) {
    setClauses.push("Description = @Description");
    req.input("Description", sql.NVarChar(500), input.description);
  }
  if (input.discountType !== undefined) {
    setClauses.push("DiscountType = @DiscountType");
    req.input("DiscountType", sql.NVarChar(20), input.discountType);
  }
  if (input.discountValue !== undefined) {
    setClauses.push("DiscountValue = @DiscountValue");
    req.input("DiscountValue", sql.Decimal(18, 2), input.discountValue);
  }
  if (input.maxDiscountAmount !== undefined) {
    setClauses.push("MaxDiscountAmount = @MaxDiscountAmount");
    req.input("MaxDiscountAmount", sql.Decimal(18, 2), input.maxDiscountAmount);
  }
  if (input.minBookingAmount !== undefined) {
    setClauses.push("MinOrderAmount = @MinOrderAmount");
    req.input("MinOrderAmount", sql.Decimal(18, 2), input.minBookingAmount);
  }
  if (input.startDate !== undefined) {
    setClauses.push("StartDate = @StartDate");
    req.input("StartDate", sql.Date, input.startDate);
  }
  if (input.endDate !== undefined) {
    setClauses.push("EndDate = @EndDate");
    req.input("EndDate", sql.Date, input.endDate);
  }
  if (input.usageLimit !== undefined) {
    setClauses.push("UsageLimit = @UsageLimit");
    req.input("UsageLimit", sql.Int, input.usageLimit);
  }
  if (input.perUserLimit !== undefined) {
    setClauses.push("PerUserLimit = @PerUserLimit");
    req.input("PerUserLimit", sql.Int, input.perUserLimit);
  }
  if (input.applyScope !== undefined) {
    setClauses.push("ApplyScope = @ApplyScope");
    req.input("ApplyScope", sql.NVarChar(20), input.applyScope);
  }
  if (input.status !== undefined) {
    setClauses.push("Status = @Status");
    req.input("Status", sql.NVarChar(30), input.status);
  }

  await req.query(`UPDATE Promotions SET ${setClauses.join(", ")} WHERE PromotionID = @ID`);
}

export async function repoUpdatePromotionStatus(id: number, status: string) {
  const pool = await getPool();
  await pool
    .request()
    .input("ID", sql.Int, id)
    .input("Status", sql.NVarChar(30), status)
    .query(`UPDATE Promotions SET Status = @Status, UpdatedAt = GETDATE() WHERE PromotionID = @ID`);
}

// ── UserPromotions ───────────────────────────────────────────────────────────

export async function repoAssignUsersToPromotion(promotionId: number, userIds: number[]) {
  const pool = await getPool();
  for (const userId of userIds) {
    // Dùng MERGE để tránh duplicate
    await pool
      .request()
      .input("PromotionID", sql.Int, promotionId)
      .input("UserID", sql.Int, userId)
      .query(`
        MERGE UserPromotions AS target
        USING (SELECT @PromotionID AS PromotionID, @UserID AS UserID) AS source
          ON target.PromotionID = source.PromotionID AND target.UserID = source.UserID
        WHEN NOT MATCHED THEN
          INSERT (PromotionID, UserID, Status) VALUES (@PromotionID, @UserID, 'Assigned')
        WHEN MATCHED AND target.Status = 'Revoked' THEN
          UPDATE SET Status = 'Assigned', UpdatedAt = GETDATE();
      `);
  }
}

export async function repoRevokeUserPromotion(promotionId: number, userId: number) {
  const pool = await getPool();
  await pool
    .request()
    .input("PromotionID", sql.Int, promotionId)
    .input("UserID", sql.Int, userId)
    .query(`
      UPDATE UserPromotions
      SET Status = 'Revoked', UpdatedAt = GETDATE()
      WHERE PromotionID = @PromotionID AND UserID = @UserID AND Status = 'Assigned'
    `);
}

export async function findUserPromotionRecord(promotionId: number, userId: number) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("PromotionID", sql.Int, promotionId)
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT * FROM UserPromotions
      WHERE PromotionID = @PromotionID AND UserID = @UserID
    `);
  return result.recordset[0] ?? null;
}

// ── Apply / Remove Promotion to Booking ────────────────────────────────────

export async function repoApplyPromotionToBooking(
  bookingId: number,
  promotionId: number,
  discountAmount: number,
  originalAmount: number,
  finalAmount: number
) {
  const pool = await getPool();
  await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .input("PromotionID", sql.Int, promotionId)
    .input("DiscountAmount", sql.Decimal(18, 2), discountAmount)
    .input("OriginalAmount", sql.Decimal(18, 2), originalAmount)
    .input("FinalAmount", sql.Decimal(18, 2), finalAmount)
    .query(`
      UPDATE Bookings
      SET PromotionID = @PromotionID,
          DiscountAmount = @DiscountAmount,
          OriginalAmount = @OriginalAmount,
          TotalAmount = @FinalAmount,
          UpdatedAt = GETDATE()
      WHERE BookingID = @BookingID
    `);
}

export async function repoRemovePromotionFromBooking(bookingId: number, originalAmount: number) {
  const pool = await getPool();
  await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .input("OriginalAmount", sql.Decimal(18, 2), originalAmount)
    .query(`
      UPDATE Bookings
      SET PromotionID = NULL,
          DiscountAmount = 0,
          TotalAmount = @OriginalAmount,
          UpdatedAt = GETDATE()
      WHERE BookingID = @BookingID
    `);
}

// ── PromotionUsages ──────────────────────────────────────────────────────────

export async function repoCreatePromotionUsage(params: {
  promotionId: number;
  userId: number;
  bookingId: number;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
}) {
  const pool = await getPool();
  await pool
    .request()
    .input("PromotionID", sql.Int, params.promotionId)
    .input("UserID", sql.Int, params.userId)
    .input("BookingID", sql.Int, params.bookingId)
    .input("DiscountAmount", sql.Decimal(18, 2), params.discountAmount)
    .input("OriginalAmount", sql.Decimal(18, 2), params.originalAmount)
    .input("FinalAmount", sql.Decimal(18, 2), params.finalAmount)
    .query(`
      -- Xóa usage cũ nếu có (idempotent)
      DELETE FROM PromotionUsages WHERE BookingID = @BookingID;
      INSERT INTO PromotionUsages
        (PromotionID, UserID, BookingID, DiscountAmount, OriginalAmount, FinalAmount, Status)
      VALUES
        (@PromotionID, @UserID, @BookingID, @DiscountAmount, @OriginalAmount, @FinalAmount, 'Reserved')
    `);
}

export async function repoMarkPromotionUsageUsed(bookingId: number) {
  const pool = await getPool();
  await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      UPDATE PromotionUsages
      SET Status = 'Used', UsedAt = GETDATE(), UpdatedAt = GETDATE()
      WHERE BookingID = @BookingID AND Status = 'Reserved'
    `);
}

export async function repoReleasePromotionUsage(bookingId: number) {
  const pool = await getPool();
  await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      UPDATE PromotionUsages
      SET Status = 'Released', ReleasedAt = GETDATE(), UpdatedAt = GETDATE()
      WHERE BookingID = @BookingID AND Status = 'Reserved'
    `);
}

export async function repoIncrementUsedCount(promotionId: number) {
  const pool = await getPool();
  await pool
    .request()
    .input("PromotionID", sql.Int, promotionId)
    .query(`
      UPDATE Promotions
      SET UsedCount = UsedCount + 1, UpdatedAt = GETDATE()
      WHERE PromotionID = @PromotionID
    `);
}

export async function repoMarkUserPromotionUsed(promotionId: number, userId: number) {
  const pool = await getPool();
  await pool
    .request()
    .input("PromotionID", sql.Int, promotionId)
    .input("UserID", sql.Int, userId)
    .query(`
      UPDATE UserPromotions
      SET Status = 'Used', UsedAt = GETDATE(), UpdatedAt = GETDATE()
      WHERE PromotionID = @PromotionID AND UserID = @UserID AND Status = 'Assigned'
    `);
}