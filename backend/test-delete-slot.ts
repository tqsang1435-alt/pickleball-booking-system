import { getPool, sql } from "./src/database/connection";
async function test() {
  const pool = await getPool();
  const res = await pool.request().query("SELECT TOP 1 SlotID FROM CourtSlots WHERE Status = 'Available'");
  if(res.recordset.length === 0) { console.log('No slots'); process.exit(0); }
  const slotId = res.recordset[0].SlotID;
  console.log('Trying to delete slot', slotId);
  const result = await pool.request().input('SlotID', sql.Int, slotId).query(`
      UPDATE CourtSlots
      SET Status    = 'Cancelled',
          UpdatedAt = GETDATE()
      OUTPUT
        INSERTED.SlotID,
        INSERTED.Status
      WHERE SlotID = @SlotID
        AND (Status IS NULL OR Status NOT IN ('Booked', 'Holding'))
    `);
  console.log('Update result:', result.recordset);
  process.exit(0);
}
test().catch(console.error);
