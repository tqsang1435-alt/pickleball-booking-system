import { getPool } from "@/database/connection";

export async function findAllPromotions() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      PromotionID,
      PromotionCode,
      PromotionName,
      DiscountType,
      DiscountValue,
      MaxDiscountAmount,
      MinOrderAmount,
      UsageLimit,
      UsedCount,
      StartDate,
      EndDate,
      Status,
      CreatedAt
    FROM Promotions
    WHERE Status = 'Active'
    ORDER BY PromotionID DESC
  `);

  return result.recordset;
}