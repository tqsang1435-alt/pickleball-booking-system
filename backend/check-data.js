const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
};

async function check() {
  const pool = await sql.connect(config);

  // Check row counts in important tables
  const tables = ["Bookings", "BookingDetails", "Users", "Courts", "Coaches"];
  for (const t of tables) {
    try {
      const r = await pool.request().query(`SELECT COUNT(*) AS cnt FROM ${t}`);
      console.log(`${t}: ${r.recordset[0].cnt} rows`);
    } catch (e) {
      console.log(`${t}: ERROR - ${e.message}`);
    }
  }

  // Check Bookings columns
  try {
    const r = await pool.request().query(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Bookings' ORDER BY ORDINAL_POSITION`
    );
    console.log("\nBookings columns:");
    r.recordset.forEach(row => console.log(` - ${row.COLUMN_NAME} (${row.DATA_TYPE})`));
  } catch (e) {
    console.log("Columns error:", e.message);
  }

  await pool.close();
}

check().catch(console.error);
