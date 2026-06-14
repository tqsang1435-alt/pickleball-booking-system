const sql = require("mssql");
const fs = require("fs");
const path = require("path");

const config = {
  server: process.env.DB_SERVER || "localhost",
  database: "PCS_System_5",
  authentication: {
    type: "default",
    options: {
      userName: "sa",
      password: "123",
    },
  },
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableKeepAlive: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
};

async function resetDatabase() {
  let pool;
  try {
    // Connect to master database first
    const masterConfig = { ...config, database: "master" };
    pool = new sql.ConnectionPool(masterConfig);
    await pool.connect();

    console.log("✓ Connected to SQL Server");

    // Drop existing database
    console.log("⏳ Dropping existing database...");
    try {
      // Kill all connections first
      await pool.request().query(`
        ALTER DATABASE PCS_System_5 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE PCS_System_5;
      `);
      console.log("✓ Database dropped");
    } catch (err) {
      if (err.message.includes("not found") || err.message.includes("does not exist")) {
        console.log("ℹ Database does not exist, creating new one");
      } else {
        console.error("Note:", err.message);
      }
    }

    // Create new database
    console.log("⏳ Creating new database...");
    await pool.request().query("CREATE DATABASE PCS_System_5");
    console.log("✓ Database created");

    await pool.close();

    // Now connect to the new database
    pool = new sql.ConnectionPool(config);
    await pool.connect();

    // Read and execute init.sql
    console.log("⏳ Creating tables...");
    let initSql = fs.readFileSync(
      path.join(__dirname, "./src/database/schema/init.sql"),
      "utf8"
    );
    // Remove GO statements completely
    initSql = initSql.replace(/^\s*GO\s*$/gim, "");
    // Execute as one batch
    const initRequest = new sql.Request(pool);
    initRequest.multiple = true;
    await initRequest.batch(initSql);
    console.log("✓ Tables created");

    // Read and execute seed.sql
    console.log("⏳ Seeding data...");
    let seedSql = fs.readFileSync(
      path.join(__dirname, "./src/database/seed/seed.sql"),
      "utf8"
    );
    // Remove GO statements completely
    seedSql = seedSql.replace(/^\s*GO\s*$/gim, "");
    
    // Disable foreign key constraints
    await pool.request().query("EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'");
    
    const seedRequest = new sql.Request(pool);
    seedRequest.multiple = true;
    await seedRequest.batch(seedSql);
    
    // Re-enable foreign key constraints
    await pool.request().query("EXEC sp_MSForEachTable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'");
    
    console.log("✓ Data seeded");

    console.log("\n✅ Database reset completed!");
    console.log("\nYou can now login with:");
    console.log("  Email: nguyen.minhanh@gmail.com");
    console.log("  Password: Password@123");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

resetDatabase();
