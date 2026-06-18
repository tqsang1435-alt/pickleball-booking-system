const sql = require("mssql");
const path = require("path");
const dotenv = require("dotenv");

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

async function fix() {
  const config = {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_DATABASE || "PCS_SYSTEM_5",
    server: process.env.DB_SERVER || "localhost",
    options: { encrypt: false, trustServerCertificate: true },
  };

  console.log("🔄 Đang kết nối tới database:", config.database);
  try {
    const pool = await sql.connect(config);
    
    const query = `
      DECLARE @ConstraintName NVARCHAR(255);

      -- Loop to drop all existing check constraints on Refunds.Status
      WHILE EXISTS (
          SELECT 1
          FROM sys.check_constraints dc
          INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
          WHERE dc.parent_object_id = OBJECT_ID('Refunds') AND c.name = 'Status'
      )
      BEGIN
          SELECT TOP 1 @ConstraintName = dc.name
          FROM sys.check_constraints dc
          INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
          WHERE dc.parent_object_id = OBJECT_ID('Refunds') AND c.name = 'Status';

          EXEC('ALTER TABLE Refunds DROP CONSTRAINT ' + @ConstraintName);
          PRINT 'Dropped constraint: ' + @ConstraintName;
      END;

      -- Add the single clean check constraint that includes 'PendingManual'
      ALTER TABLE Refunds ADD CONSTRAINT CK_Refunds_Status CHECK (Status IN ('Requested', 'Approved', 'Rejected', 'Processing', 'PendingManual', 'Completed', 'Failed'));
      PRINT 'Added new clean constraint CK_Refunds_Status including PendingManual.';
    `;

    const request = pool.request();
    request.on('info', msg => console.log('SQL info:', msg.message));
    
    await request.query(query);
    console.log("✅ Cập nhật Check Constraint cho bảng Refunds thành công!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật check constraint:", err);
    process.exit(1);
  }
}

fix();
