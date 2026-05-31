import { getPool } from "./src/database/connection";

async function fix() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('CourtSlots') 
  `);
  
  if (res.recordset.length === 0) {
    console.log('Constraint not found');
    process.exit(0);
  }
  
  // Find the constraint related to Status
  for (const row of res.recordset) {
    if (row.name.includes('Statu') || row.name.includes('CK__CourtSlot')) {
      const constraintName = row.name;
      console.log('Found constraint:', constraintName);
      
      await pool.request().query(`ALTER TABLE CourtSlots DROP CONSTRAINT ${constraintName}`);
      await pool.request().query(`ALTER TABLE CourtSlots ADD CONSTRAINT CK_CourtSlots_Status CHECK (Status IN ('Available', 'Holding', 'Booked', 'Blocked', 'Maintenance', 'Cancelled'))`);
      console.log('Constraint updated to include Cancelled');
      process.exit(0);
    }
  }
  
  console.log('Status constraint not found');
  process.exit(0);
}

fix().catch(console.error);
