const sql = require("mssql");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function runMigration() {
  console.log("🔄 Connecting to database...");
  
  try {
    const pool = await sql.connect(config);
    console.log("✅ Connected to database");

    // Migration 1: Promotions table
    console.log("📝 Checking Promotions table...");
    const promotionsCheck = await pool.request().query(`
      SELECT COUNT(*) as hasColumn
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('Promotions') 
      AND name = 'UpdatedAt'
    `);
    
    if (promotionsCheck.recordset[0].hasColumn === 0) {
      console.log("  ➕ Adding UpdatedAt column...");
      await pool.request().query(`ALTER TABLE Promotions ADD UpdatedAt DATETIME NULL`);
      await pool.request().query(`UPDATE Promotions SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL`);
      console.log("  ✅ Done");
    } else {
      console.log("  ✓ Column already exists");
    }

    // Migration 2: UserPromotions table
    console.log("📝 Checking UserPromotions table...");
    const userPromotionsCheck = await pool.request().query(`
      SELECT COUNT(*) as hasColumn
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('UserPromotions') 
      AND name = 'UpdatedAt'
    `);
    
    if (userPromotionsCheck.recordset[0].hasColumn === 0) {
      console.log("  ➕ Adding UpdatedAt column...");
      await pool.request().query(`ALTER TABLE UserPromotions ADD UpdatedAt DATETIME NULL`);
      await pool.request().query(`UPDATE UserPromotions SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL`);
      console.log("  ✅ Done");
    } else {
      console.log("  ✓ Column already exists");
    }

    // Migration 3: PromotionUsages table
    console.log("📝 Checking PromotionUsages table...");
    const promotionUsagesCheck = await pool.request().query(`
      SELECT COUNT(*) as hasColumn
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('PromotionUsages') 
      AND name = 'UpdatedAt'
    `);
    
    if (promotionUsagesCheck.recordset[0].hasColumn === 0) {
      console.log("  ➕ Adding UpdatedAt column...");
      await pool.request().query(`ALTER TABLE PromotionUsages ADD UpdatedAt DATETIME NULL`);
      await pool.request().query(`UPDATE PromotionUsages SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL`);
      console.log("  ✅ Done");
    } else {
      console.log("  ✓ Column already exists");
    }

    console.log("\n✅ Migration completed successfully!");

    await pool.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
