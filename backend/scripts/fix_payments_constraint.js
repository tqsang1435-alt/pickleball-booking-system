const sql = require("mssql");
require("dotenv").config();

async function fix() {
  const config = {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_DATABASE || "PCS_SYSTEM_5",
    server: process.env.DB_SERVER || "localhost",
    options: { encrypt: false, trustServerCertificate: true },
  };

  console.log("Connecting to:", config.database);
  try {
    const pool = await sql.connect(config);
    
    const query = `
      DECLARE @ConstraintName NVARCHAR(255);

      -- Loop to drop all existing check constraints on Payments.PaymentMethod
      WHILE EXISTS (
          SELECT 1
          FROM sys.check_constraints dc
          INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
          WHERE dc.parent_object_id = OBJECT_ID('Payments') AND c.name = 'PaymentMethod'
      )
      BEGIN
          SELECT TOP 1 @ConstraintName = dc.name
          FROM sys.check_constraints dc
          INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
          WHERE dc.parent_object_id = OBJECT_ID('Payments') AND c.name = 'PaymentMethod';

          EXEC('ALTER TABLE Payments DROP CONSTRAINT ' + @ConstraintName);
          PRINT 'Dropped constraint: ' + @ConstraintName;
      END;

      -- Add the single clean check constraint
      ALTER TABLE Payments ADD CONSTRAINT CK_Payments_PaymentMethod CHECK (PaymentMethod IN ('VNPay', 'Momo', 'PayOS'));
      PRINT 'Added new clean constraint CK_Payments_PaymentMethod.';
    `;

    const request = pool.request();
    request.on('info', msg => console.log('SQL:', msg.message));
    
    await request.query(query);
    console.log("Database update completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating database:", err);
    process.exit(1);
  }
}

fix();
