const sql = require("mssql");
require("dotenv").config();

async function list() {
  const config = {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_DATABASE || "PCS_SYSTEM_5",
    server: process.env.DB_SERVER || "localhost",
    options: { encrypt: false, trustServerCertificate: true },
  };

  console.log("Connecting to:", config.database);
  try {
    const pool = await sql.connect(config);
    const res = await pool.query(`
      SELECT name, definition 
      FROM sys.check_constraints 
      WHERE parent_object_id = OBJECT_ID('Payments')
    `);
    console.log("Check constraints on Payments:");
    console.table(res.recordset);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

list();
