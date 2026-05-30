import { getPool } from "./database/connection";

async function run() {
  try {
    console.log("Connecting to database...");
    const pool = await getPool();
    console.log("Connected. Querying Promotions...");
    const result = await pool.request().query("SELECT * FROM Promotions");
    console.log("Promotions found:", result.recordset);
  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    process.exit(0);
  }
}

run();
