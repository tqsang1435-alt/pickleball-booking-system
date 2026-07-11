import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

import { getPool } from "../src/database/connection";

async function main() {
  console.log("⚙️  Updating existing tournament divisions status...");
  try {
    const pool = await getPool();
    // Cập nhật tất cả các Division có trạng thái 'Draft' sang 'Open' nếu giải đấu tương ứng có trạng thái là 'Open'
    const result = await pool.request().query(`
      UPDATE TournamentDivisions
      SET Status = 'Open', UpdatedAt = GETDATE()
      WHERE Status = 'Draft'
        AND TournamentID IN (
          SELECT TournamentID FROM Tournaments WHERE Status = 'Open'
        )
    `);
    console.log(`✅ Cập nhật thành công! Số bản ghi bị ảnh hưởng: ${result.rowsAffected[0]}`);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật database:", err);
  } finally {
    process.exit(0);
  }
}

main();
