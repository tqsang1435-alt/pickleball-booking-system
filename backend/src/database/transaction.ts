import sql from "mssql";
import { databaseConfig } from "@/config/database";

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (pool) return pool;

  pool = await sql.connect(databaseConfig);
  return pool;
}

export { sql };