import sql from "mssql";
import { databaseConfig } from "@/config/database";

let pool: sql.ConnectionPool | null = null;

function startBackgroundJobs() {
  const globalAny = global as any;
  if (globalAny.__cronRunning) return;
  globalAny.__cronRunning = true;

  console.log("[System] Bắt đầu background jobs: Tự động dọn dẹp DB...");

  setInterval(async () => {
    try {
      const { releaseExpiredBookings } = await import("@/modules/bookings/bookings.service");
      const { repoMarkCompletedExpiredCheckins } = await import("@/modules/bookings/bookings.repository");
      
      const res = await releaseExpiredBookings();
      const completed = await repoMarkCompletedExpiredCheckins();

      if (res.releasedHoldings > 0 || res.autoCheckedIn > 0 || completed > 0) {
        console.log(`[Cron] Hủy ${res.releasedHoldings} đơn hết hạn, Auto Check-in ${res.autoCheckedIn}, Auto Complete ${completed}`);
      }
    } catch (err) {
      console.error("[Cron] Lỗi chạy background task:", err);
    }
  }, 10 * 1000); // 10 giây chạy 1 lần để test cho nhanh, production có thể để 1 phút
}

export async function getPool() {
  if (pool) return pool;

  pool = await sql.connect(databaseConfig);

  startBackgroundJobs();


  // Self-migration: ensure LockReason column exists in Users table
  try {
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('Users') AND name = 'LockReason'
      )
      BEGIN
        ALTER TABLE Users ADD LockReason NVARCHAR(255) NULL;
      END
    `);
  } catch (err) {
    console.error("Migration error (ensuring LockReason column in Users):", err);
  }

  return pool;
}

export { sql };