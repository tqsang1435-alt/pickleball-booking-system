const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
};

const columns = [
  { name: "Description",   def: "NVARCHAR(500) NULL" },
  { name: "PerUserLimit",  def: "INT NULL" },
  { name: "ApplyScope",    def: "NVARCHAR(20) NOT NULL CONSTRAINT DF_Promotions_ApplyScope DEFAULT 'Public'" },
  { name: "CreatedBy",     def: "INT NULL" },
];

async function run() {
  const pool = await sql.connect(config);
  console.log("✅ Connected");

  for (const col of columns) {
    const check = await pool.request().query(
      `SELECT COUNT(*) as cnt FROM sys.columns WHERE object_id = OBJECT_ID('Promotions') AND name = '${col.name}'`
    );
    if (check.recordset[0].cnt === 0) {
      await pool.request().query(`ALTER TABLE Promotions ADD ${col.name} ${col.def}`);
      console.log(`  ➕ Added column: ${col.name}`);
    } else {
      console.log(`  ✓  Already exists: ${col.name}`);
    }
  }

  console.log("✅ Done");
  await pool.close();
}

run().catch(console.error);
