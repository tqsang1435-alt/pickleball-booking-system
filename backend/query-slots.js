const sql = require("mssql");
require("dotenv").config({ path: ".env.local" });

async function run() {
  try {
    const pool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      server: process.env.DB_SERVER || "localhost",
      options: { encrypt: false, trustServerCertificate: true },
    });
    
    // Get column info
    const columns = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'CourtSlots'
    `);
    console.log("CourtSlots columns:", columns.recordset);

    // Get sample data
    const samples = await pool.query(`
      SELECT TOP (10) * FROM CourtSlots
    `);
    console.log("CourtSlots samples:", samples.recordset);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
