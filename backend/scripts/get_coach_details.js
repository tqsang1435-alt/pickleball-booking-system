const sql = require("mssql");
require("dotenv").config();

async function run() {
  try {
    const config = {
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "123456",
      database: process.env.DB_DATABASE || "PCS_SYSTEM_5",
      server: process.env.DB_SERVER || "localhost",
      options: { encrypt: false, trustServerCertificate: true },
    };

    const pool = await sql.connect(config);

    console.log("--- COLUMNS IN COACHES TABLE ---");
    const cols = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Coaches'
    `);
    console.log(cols.recordset);

    console.log("\n--- SELECT TOP 5 FROM COACHES TABLE ---");
    const coaches = await pool.query(`
      SELECT TOP 5 c.*, u.FullName 
      FROM Coaches c
      INNER JOIN Users u ON c.UserID = u.UserID
    `);
    console.log(JSON.stringify(coaches.recordset, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
