const sql = require("mssql");
const path = require("path");
const dotenv = require("dotenv");

// Load .env
dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
  const config = {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_DATABASE || "PCS_SYSTEM_5",
    server: process.env.DB_SERVER || "localhost",
    options: { encrypt: false, trustServerCertificate: true },
  };

  try {
    const pool = await sql.connect(config);
    const res = await pool.query(`
      SELECT name, definition 
      FROM sys.check_constraints 
      WHERE parent_object_id = OBJECT_ID('Refunds')
    `);
    console.log("Check constraints on Refunds:");
    console.table(res.recordset);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
