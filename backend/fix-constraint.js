const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE, // FIX
  server: process.env.DB_SERVER || 'localhost',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
};

async function fix() {
  await sql.connect(config);
  const res = await sql.query(`
    SELECT name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('CourtSlots') 
  `);
  
  let found = false;
  for (const row of res.recordset) {
    if (row.name.includes('Statu') || row.name.includes('CK__CourtSlot')) {
      const constraintName = row.name;
      console.log('Found constraint:', constraintName);
      
      await sql.query(`ALTER TABLE CourtSlots DROP CONSTRAINT ${constraintName}`);
      await sql.query(`ALTER TABLE CourtSlots ADD CONSTRAINT CK_CourtSlots_Status CHECK (Status IN ('Available', 'Holding', 'Booked', 'Blocked', 'Maintenance', 'Cancelled'))`);
      console.log('Constraint updated to include Cancelled');
      found = true;
      process.exit(0);
    }
  }
  
  if (!found) {
    console.log('Constraint not found');
  }
  process.exit(0);
}

fix().catch(console.error);
