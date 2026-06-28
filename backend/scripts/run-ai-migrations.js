const sql = require("mssql");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function migrate() {
  console.log("Connecting to Database server:", process.env.DB_SERVER || "localhost");
  const pool = await sql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER || "localhost",
    options: { encrypt: false, trustServerCertificate: true },
  });

  console.log("Connected. Creating tables...");

  await pool.query(`
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[AIOccupancyForecasts]') AND type in (N'U'))
    BEGIN
      CREATE TABLE AIOccupancyForecasts (
          ForecastID INT IDENTITY(1,1) PRIMARY KEY,
          CourtID INT NOT NULL,
          ForecastDate DATE NOT NULL,
          HourStart INT NOT NULL,
          PredictedRate DECIMAL(5,2) NOT NULL,
          ModelVersion NVARCHAR(50) NOT NULL,
          CreatedAt DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (CourtID) REFERENCES Courts(CourtID)
      );
      PRINT 'Created AIOccupancyForecasts table';
    END
    ELSE
    BEGIN
      PRINT 'AIOccupancyForecasts table already exists';
    END

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[AIPromotionRecommendations]') AND type in (N'U'))
    BEGIN
      CREATE TABLE AIPromotionRecommendations (
          RecommendationID INT IDENTITY(1,1) PRIMARY KEY,
          TargetDate DATE NOT NULL,
          TargetHourRange NVARCHAR(50) NOT NULL,
          SuggestedDiscount DECIMAL(5,2) NOT NULL,
          DiscountType NVARCHAR(20) DEFAULT 'Percent',
          Reasoning NVARCHAR(MAX) NOT NULL,
          MarketingMessage NVARCHAR(MAX) NOT NULL,
          Status NVARCHAR(30) DEFAULT 'Suggested',
          CreatedAt DATETIME DEFAULT GETDATE(),
          UpdatedAt DATETIME
      );
      PRINT 'Created AIPromotionRecommendations table';
    END
    ELSE
    BEGIN
      PRINT 'AIPromotionRecommendations table already exists';
    END

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[AIModelLogs]') AND type in (N'U'))
    BEGIN
      CREATE TABLE AIModelLogs (
          LogID INT IDENTITY(1,1) PRIMARY KEY,
          RequestType NVARCHAR(50) NOT NULL,
          LatencyMs INT NOT NULL,
          InputPayload NVARCHAR(MAX),
          OutputPayload NVARCHAR(MAX),
          ActualRate DECIMAL(5,2) NULL,
          ForecastError DECIMAL(5,2) NULL,
          CreatedAt DATETIME DEFAULT GETDATE()
      );
      PRINT 'Created AIModelLogs table';
    END
    ELSE
    BEGIN
      PRINT 'AIModelLogs table already exists';
    END
  `);

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
