const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER || 'localhost',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
};

async function generate() {
  await sql.connect(config);
  
  // Get all courts
  const courts = await sql.query("SELECT CourtID, PricePerHour FROM Courts WHERE Status = 'Available'");
  
  // Get all coaches
  const coaches = await sql.query("SELECT CoachID FROM Coaches");

  // Generate for Today and Tomorrow
  const dates = [];
  const today = new Date();
  dates.push(new Date(today));
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  dates.push(tomorrow);

  let slotsCount = 0;
  let schedulesCount = 0;

  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0];
    
    // 1. Generate Slots
    for (const court of courts.recordset) {
      for (let hour = 18; hour <= 20; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hour+1).toString().padStart(2, '0')}:00:00`;
        
        const check = await sql.query(`SELECT 1 FROM CourtSlots WHERE CourtID = ${court.CourtID} AND SlotDate = '${dateStr}' AND StartTime = '${startTime}'`);
        
        if (check.recordset.length === 0) {
          await sql.query(`INSERT INTO CourtSlots (CourtID, SlotDate, StartTime, EndTime, Price, Status) VALUES (${court.CourtID}, '${dateStr}', '${startTime}', '${endTime}', ${court.PricePerHour}, 'Available')`);
          slotsCount++;
        } else {
            await sql.query(`UPDATE CourtSlots SET Status = 'Available' WHERE CourtID = ${court.CourtID} AND SlotDate = '${dateStr}' AND StartTime = '${startTime}' AND Status = 'Cancelled'`);
        }
      }
    }
    
    // 2. Generate Coach Schedules
    for (const coach of coaches.recordset) {
      for (let hour = 18; hour <= 20; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hour+1).toString().padStart(2, '0')}:00:00`;
        
        const check = await sql.query(`SELECT 1 FROM CoachSchedules WHERE CoachID = ${coach.CoachID} AND WorkingDate = '${dateStr}' AND StartTime = '${startTime}'`);
        
        if (check.recordset.length === 0) {
          await sql.query(`INSERT INTO CoachSchedules (CoachID, WorkingDate, StartTime, EndTime, Status) VALUES (${coach.CoachID}, '${dateStr}', '${startTime}', '${endTime}', 'Available')`);
          schedulesCount++;
        } else {
            await sql.query(`UPDATE CoachSchedules SET Status = 'Available' WHERE CoachID = ${coach.CoachID} AND WorkingDate = '${dateStr}' AND StartTime = '${startTime}'`);
        }
      }
    }
  }

  console.log(`Generated ${slotsCount} slots and ${schedulesCount} coach schedules for 18:00 - 21:00`);
  process.exit(0);
}
generate().catch(console.error);
