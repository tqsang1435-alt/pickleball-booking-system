import {
  getPool,
} from "@/database/connection";

export async function up(): Promise<void> {
  const pool = await getPool();

  await pool.request().query(`
    IF OBJECT_ID(
      N'dbo.ReportExportLogs',
      N'U'
    ) IS NULL
    BEGIN
      CREATE TABLE dbo.ReportExportLogs (
        ReportExportLogID INT
          IDENTITY(1, 1)
          NOT NULL,

        ExportedBy INT
          NOT NULL,

        ReportType NVARCHAR(50)
          NOT NULL,

        [Format] NVARCHAR(10)
          NOT NULL,

        Filters NVARCHAR(MAX)
          NOT NULL,

        [FileName] NVARCHAR(255)
          NULL,

        [RowCount] INT
          NOT NULL
          CONSTRAINT DF_ReportExportLogs_RowCount
          DEFAULT 0,

        [Status] NVARCHAR(20)
          NOT NULL,

        ErrorMessage NVARCHAR(MAX)
          NULL,

        CreatedAt DATETIME2
          NOT NULL
          CONSTRAINT DF_ReportExportLogs_CreatedAt
          DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_ReportExportLogs
          PRIMARY KEY (
            ReportExportLogID
          ),

        CONSTRAINT FK_ReportExportLogs_Users
          FOREIGN KEY (
            ExportedBy
          )
          REFERENCES dbo.Users (
            UserID
          ),

        CONSTRAINT CK_ReportExportLogs_Format
          CHECK (
            [Format] IN (
              'csv',
              'xlsx'
            )
          ),

        CONSTRAINT CK_ReportExportLogs_Status
          CHECK (
            [Status] IN (
              'SUCCESS',
              'FAILED'
            )
          )
      );

      CREATE INDEX
        IX_ReportExportLogs_ExportedBy
      ON dbo.ReportExportLogs (
        ExportedBy
      );

      CREATE INDEX
        IX_ReportExportLogs_ReportType
      ON dbo.ReportExportLogs (
        ReportType
      );

      CREATE INDEX
        IX_ReportExportLogs_CreatedAt
      ON dbo.ReportExportLogs (
        CreatedAt DESC
      );
    END;
  `);
}

export async function down(): Promise<void> {
  const pool = await getPool();

  await pool.request().query(`
    IF OBJECT_ID(
      N'dbo.ReportExportLogs',
      N'U'
    ) IS NOT NULL
    BEGIN
      DROP TABLE dbo.ReportExportLogs;
    END;
  `);
}