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
  const r = await pool.request().query(
    "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Promotions' ORDER BY ORDINAL_POSITION"
  );
  console.log("Promotions columns:");
  r.recordset.forEach(row => console.log(` - ${row.COLUMN_NAME} (${row.DATA_TYPE})`));
  await pool.close();
}

check().catch(console.error);
