import { getPool, sql } from "../src/database/connection";

async function run() {
  const pool = await getPool();
  console.log("Generating slots for Court 2 on 2026-06-29 and 2026-06-30...");
  
  const dates = ["2026-06-29", "2026-06-30"];
  for (const date of dates) {
    await pool.request()
      .input("CourtID", sql.Int, 2)
      .input("SlotDate", sql.Date, date)
      .query("DELETE FROM CourtSlots WHERE CourtID = @CourtID AND SlotDate = @SlotDate");

    for (let h = 5; h < 23; h++) {
      const startTime = `${h.toString().padStart(2, "0")}:00`;
      const endTime = `${(h + 1).toString().padStart(2, "0")}:00`;
      
      await pool.request()
        .input("CourtID", sql.Int, 2)
        .input("SlotDate", sql.Date, date)
        .input("StartTime", sql.VarChar(5), startTime)
        .input("EndTime", sql.VarChar(5), endTime)
        .input("Price", sql.Decimal(18, 2), 100000.0)
        .query(`
          INSERT INTO CourtSlots (CourtID, SlotDate, StartTime, EndTime, Price, Status)
          VALUES (@CourtID, @SlotDate, CAST(@StartTime AS TIME), CAST(@EndTime AS TIME), @Price, 'Available')
        `);
    }
  }
  console.log("Slots generated successfully!");
  process.exit(0);
}

run().catch(console.error);
