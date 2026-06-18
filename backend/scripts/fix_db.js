const sql = require("mssql");
require("dotenv").config();

async function run() {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER || "localhost",
    options: { encrypt: false, trustServerCertificate: true },
  };

  console.log("Connecting to database:", config.database, "on server:", config.server);
  
  try {
    const pool = await sql.connect(config);
    console.log("Connected successfully!");

    // Helper function to check if column exists
    const checkColumn = async (tableName, columnName) => {
      const checkQuery = `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'
      `;
      const res = await pool.query(checkQuery);
      return res.recordset.length > 0;
    };

    const addColumn = async (tableName, columnName, definition) => {
      const exists = await checkColumn(tableName, columnName);
      if (exists) {
        console.log(`Column '${columnName}' already exists in table '${tableName}'.`);
      } else {
        console.log(`Adding column '${columnName}' to table '${tableName}'...`);
        await pool.query(`ALTER TABLE ${tableName} ADD ${columnName} ${definition}`);
        console.log(`Column '${columnName}' added successfully.`);
      }
    };

    // Columns to add to Promotions
    await addColumn("Promotions", "Description", "NVARCHAR(500) NULL");
    await addColumn("Promotions", "PerUserLimit", "INT NOT NULL DEFAULT 1");
    await addColumn("Promotions", "ApplyScope", "NVARCHAR(20) NOT NULL DEFAULT 'Public'");
    await addColumn("Promotions", "CreatedBy", "INT NULL FOREIGN KEY REFERENCES Users(UserID)");
    await addColumn("Promotions", "UpdatedAt", "DATETIME NULL");

    console.log("Database schema updates finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Database connection/query error:", err);
    process.exit(1);
  }
}

run();
