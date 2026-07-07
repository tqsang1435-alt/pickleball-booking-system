import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

import { getPool } from "../src/database/connection";
import sql from "mssql";
import bcrypt from "bcryptjs";

import fs from "fs";

// Import needed constants
import { 
  TOURNAMENT_STATUS, 
  DIVISION_STATUS, 
  COMPETITION_FORMAT, 
  BRACKET_TYPE, 
  GENDER_REQUIREMENT, 
  AGE_GROUP 
} from "../src/modules/tournaments/tournaments.constants";

const HASHED_PASS = bcrypt.hashSync("Password123!", 10);

async function seedE2E() {
  console.log("🌱 Bắt đầu tạo dữ liệu E2E...");
  const pool = await getPool();

  try {
    // Tự động kiểm tra và khởi tạo cấu trúc database giải đấu
    const schemaPath = path.join(__dirname, "tournament_schema.sql");
    if (fs.existsSync(schemaPath)) {
      console.log("🛠️ Đang đồng bộ cấu trúc database giải đấu...");
      const schemaSql = fs.readFileSync(schemaPath, "utf-8");
      await pool.request().query(schemaSql);
      console.log("✅ Đồng bộ cấu trúc database thành công!");
    }

    console.log("🧹 Dọn dẹp sạch sẽ toàn bộ dữ liệu giải đấu cũ...");
    await pool.request().query(`
      DELETE FROM TournamentRegistrationAthletes;
      DELETE FROM TournamentPartnerRequests;
      DELETE FROM TournamentTeamInvitations;
      DELETE FROM TournamentPayments;
      DELETE FROM TournamentMatchCheckins;
      DELETE FROM TournamentCourtBlocks;
      DELETE FROM TournamentMatchScores;
      DELETE FROM TournamentMatches;
      DELETE FROM TournamentStandings;
      DELETE FROM TournamentRegistrations;
      DELETE FROM TournamentTeamMembers;
      DELETE FROM TournamentTeams;
      DELETE FROM TournamentDivisions;
      DELETE FROM Tournaments;
    `);

    // 1. Tạo Users (Admin, Staff, 59 Players)
    let adminId = 0, staffId = 0;
    const playerIds: number[] = [];

    const createOrGetUser = async (email: string, role: string, name: string) => {
      const res = await pool.request().input("Email", sql.NVarChar, email).query(`SELECT UserID FROM Users WHERE Email = @Email`);
      if (res.recordset.length > 0) return res.recordset[0].UserID;
      const insert = await pool.request()
        .input("Email", sql.NVarChar, email)
        .input("PasswordHash", sql.NVarChar, HASHED_PASS)
        .input("FullName", sql.NVarChar, name)
        .input("PhoneNumber", sql.NVarChar, "09" + Math.floor(10000000 + Math.random() * 90000000).toString())
        .query(`
          INSERT INTO Users (Email, PasswordHash, FullName, PhoneNumber, Gender, DateOfBirth)
          OUTPUT INSERTED.UserID
          VALUES (@Email, @PasswordHash, @FullName, @PhoneNumber, 'Male', '1990-01-01')
        `);
      const uid = insert.recordset[0].UserID;
      await pool.request().query(`
        INSERT INTO UserRoles (UserID, RoleID) 
        SELECT ${uid}, RoleID FROM Roles WHERE RoleName = '${role}'
      `);
      return uid;
    };

    adminId = await createOrGetUser("admin.e2e@test.com", "Admin", "E2E Admin");
    staffId = await createOrGetUser("staff.e2e@test.com", "Staff", "E2E Staff");

    for (let i = 1; i <= 59; i++) {
      const pId = await createOrGetUser(`player${i.toString().padStart(2, '0')}.e2e@test.com`, "Player", `E2E Player ${i}`);
      playerIds.push(pId);
    }
    console.log(`✅ Đã tạo Admin, Staff và ${playerIds.length} Players.`);

    // 2. Tạo Courts
    console.log("🧹 Dọn dẹp sân và booking E2E cũ...");
    await pool.request().query("DELETE FROM BookingDetails WHERE BookingID IN (SELECT BookingID FROM Bookings WHERE BookingCode = 'E2E_BOOK_C6')");
    await pool.request().query("DELETE FROM Bookings WHERE BookingCode = 'E2E_BOOK_C6'");
    await pool.request().query("DELETE FROM Courts WHERE CourtName LIKE 'E2E_Court%'");

    const courtIds: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const cStatus = i === 5 ? 'Inactive' : 'Available';
      const insertCourt = await pool.request()
        .input("CourtCode", sql.NVarChar, `E2E_C${i}`)
        .input("CourtName", sql.NVarChar, `E2E_Court ${i}`)
        .input("Status", sql.NVarChar, cStatus)
        .query(`
          INSERT INTO Courts (CourtCode, CourtName, CourtType, PricePerHour, Status, Location, OpenTime, CloseTime)
          OUTPUT INSERTED.CourtID
          VALUES (@CourtCode, @CourtName, 'Indoor', 100000, @Status, 'E2E Pickleball Center', '06:00', '22:00')
        `);
      courtIds.push(insertCourt.recordset[0].CourtID);
    }
    console.log(`✅ Đã tạo 6 Courts (Court 5 Inactive). ID: ${courtIds.join(", ")}`);

    // 3. Tạo Booking giả cho Court 6 (Trùng lịch sáng 09:00 - 10:00 ngày mai)
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const bRes = await pool.request()
      .query(`
        INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, CoachFee, DiscountAmount, TotalAmount, OriginalAmount, Status, PaymentStatus, CreatedAt)
        OUTPUT INSERTED.BookingID
        VALUES ('E2E_BOOK_C6', ${adminId}, 'Court', '${tomorrowStr}', 100000, 0, 0, 100000, 100000, 'Confirmed', 'Paid', GETDATE())
      `);
    const bookingId = bRes.recordset[0].BookingID;
    
    // Lấy đại 1 SlotID
    const slotRes = await pool.request().query("SELECT TOP 1 SlotID FROM CourtSlots");
    const slotId = slotRes.recordset[0]?.SlotID || 1;

    await pool.request().query(`
      INSERT INTO BookingDetails (BookingID, SlotID, CourtID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal)
      VALUES (${bookingId}, ${slotId}, ${courtIds[5]}, '${tomorrowStr}', '09:00:00', '10:00:00', 100000, 0, 100000)
    `);
    console.log("✅ Đã tạo booking giả cho Court 6 (09:00 - 10:00 ngày mai).");

    // 4. Tạo Tournament
    const tInsert = await pool.request()
      .input("TName", sql.NVarChar, "E2E PICKLEBALL TEST OPEN 2026")
      .query(`
        INSERT INTO Tournaments (TournamentCode, TournamentName, RegistrationStart, RegistrationEnd, TournamentStart, TournamentEnd, Status, CreatedBy, Location)
        OUTPUT INSERTED.TournamentID
        VALUES ('E2E2026', @TName, '2026-07-01', '2026-07-10', '2026-07-15', '2026-07-20', 'Open', ${adminId}, 'E2E Pickleball Center')
      `);
    const tId = tInsert.recordset[0].TournamentID;
    console.log(`✅ Đã tạo Tournament (ID: ${tId})`);

    // 5. Tạo Divisions
    const createDivision = async (name: string, format: string, bracket: string, maxT: number) => {
      const res = await pool.request()
        .query(`
          INSERT INTO TournamentDivisions (TournamentID, DivisionName, CompetitionFormat, TeamSize, GenderRequirement, AgeGroup, MaxTeams, BracketType, EnableThirdPlace, Status)
          OUTPUT INSERTED.DivisionID
          VALUES (${tId}, '${name}', '${format}', 2, '${GENDER_REQUIREMENT.MALE_ONLY}', '${AGE_GROUP.OPEN}', ${maxT}, '${bracket}', 1, 'Open')
        `);
      return res.recordset[0].DivisionID;
    };

    const d1 = await createDivision("E2E_Đôi Nam 4.0 - 4 đội", COMPETITION_FORMAT.MEN_DOUBLES, BRACKET_TYPE.ROUND_ROBIN, 4);
    const d2 = await createDivision("E2E_Đôi Nam 4.5 - 5 đội", COMPETITION_FORMAT.MEN_DOUBLES, BRACKET_TYPE.ROUND_ROBIN, 5);
    const d3 = await pool.request().query(`
      INSERT INTO TournamentDivisions (TournamentID, DivisionName, CompetitionFormat, TeamSize, GenderRequirement, AgeGroup, MaxTeams, BracketType, EnableThirdPlace, Status)
      OUTPUT INSERTED.DivisionID
      VALUES (${tId}, 'E2E_Đôi Nam Nữ 5.0 - GroupKnockout', '${COMPETITION_FORMAT.MIXED_DOUBLES}', 2, '${GENDER_REQUIREMENT.MIXED}', '${AGE_GROUP.OPEN}', 12, '${BRACKET_TYPE.GROUP_KNOCKOUT}', 1, 'Open')
    `).then(r => r.recordset[0].DivisionID);
    const d4 = await createDivision("E2E_Knockout Test - 8 đội", COMPETITION_FORMAT.MEN_DOUBLES, BRACKET_TYPE.SINGLE_ELIMINATION, 8);

    console.log(`✅ Đã tạo 4 Divisions (IDs: ${d1}, ${d2}, ${d3}, ${d4})`);

    // 6. Helper insert Team
    let pIdx = 0;
    const addTeam = async (divId: number, prefix: string, teamIdx: number) => {
      const p1 = playerIds[pIdx++];
      const p2 = playerIds[pIdx++];
      
      const tRes = await pool.request().query(`
        INSERT INTO TournamentTeams (TournamentID, DivisionID, TeamName, CreatedBy, TeamStatus)
        OUTPUT INSERTED.TeamID
        VALUES (${tId}, ${divId}, 'E2E_${prefix} ${teamIdx}', ${p1}, 'Registered')
      `);
      const teamId = tRes.recordset[0].TeamID;

      await pool.request().query(`
        INSERT INTO TournamentTeamMembers (TournamentID, DivisionID, TeamID, UserID, MemberRole, JoinStatus)
        VALUES 
        (${tId}, ${divId}, ${teamId}, ${p1}, 'Leader', 'Accepted'),
        (${tId}, ${divId}, ${teamId}, ${p2}, 'Member', 'Accepted')
      `);

      await pool.request().query(`
        INSERT INTO TournamentRegistrations (TournamentID, DivisionID, TeamID, RegisteredBy, RegistrationStatus, PaymentStatus)
        VALUES (${tId}, ${divId}, ${teamId}, ${p1}, 'Confirmed', 'Paid')
      `);
    };

    // Tạo Teams cho các Division (Tổng 29 teams = 58 players)
    for (let i = 1; i <= 4; i++) await addTeam(d1, 'Team A', i);
    for (let i = 1; i <= 5; i++) await addTeam(d2, 'Team B', i);
    // 12 teams for GroupKnockout
    for (let i = 1; i <= 12; i++) await addTeam(d3, 'Team G', i);
    // 8 teams for Knockout
    for (let i = 1; i <= 8; i++) await addTeam(d4, 'KO Team', i);

    console.log(`✅ Đã tạo đủ 29 Teams và Registrations tương ứng. (player59 được để trống không tham gia team nào)`);

    // Tournament và các Divisions được giữ nguyên ở trạng thái 'Open' để người dùng có thể test đăng ký player mới trên UI!
    console.log("\n=======================================");
    console.log("🎯 SEED E2E SUCCESSFUL!");
    console.log(`Tournament ID: ${tId}`);
    console.log(`Division 4 RR: ${d1}`);
    console.log(`Division 5 RR: ${d2}`);
    console.log(`Division 12 GK: ${d3}`);
    console.log(`Division 8 SE: ${d4}`);
    console.log("Admin: admin.e2e@test.com (Password123!)");
    console.log("Player 59: player59.e2e@test.com (Chưa đăng ký team/giải nào)");
    console.log("=======================================\n");

  } catch (err) {
    console.error("❌ Lỗi seed dữ liệu:", err);
  } finally {
    process.exit(0);
  }
}

seedE2E();
