import "dotenv/config";

export const env = {
  dbUser: process.env.DB_USER || "sa",
  dbPassword: process.env.DB_PASSWORD || "",
  dbServer: process.env.DB_SERVER || "localhost",
  dbName: process.env.DB_DATABASE || "PCS_System",
  dbPort: Number(process.env.DB_PORT || 1433),

  jwtSecret: process.env.JWT_SECRET || "pcs_secret_key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",

  nodeEnv: process.env.NODE_ENV || "development",
};