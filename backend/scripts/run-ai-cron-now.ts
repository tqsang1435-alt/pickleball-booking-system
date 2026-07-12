import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

import { runAICronJob } from "../src/modules/ai/ai-analytics.service";
import { getPool } from "../src/database/connection";

async function runNow() {
  console.log("🤖 Khởi chạy retraining và dự báo AI ngay lập tức...");
  try {
    // Connect to SQL Server first
    const pool = await getPool();
    
    // Call AI Cron Job with force = true
    await runAICronJob(true);
    
    console.log("✅ Hoàn thành chạy tác vụ AI thành công!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Lỗi khi chạy AI:", error);
    process.exit(1);
  }
}

runNow();
