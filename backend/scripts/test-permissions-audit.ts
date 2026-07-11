import { getPool, sql } from "../src/database/connection";
import * as tournamentService from "../src/modules/tournaments/tournaments.service";
import * as tournamentRepo from "../src/modules/tournaments/tournaments.repository";
import { TOURNAMENT_STATUS, DIVISION_STATUS, MATCH_STATUS } from "../src/modules/tournaments/tournaments.constants";

async function runPermissionsTest() {
  console.log("=============================================================");
  console.log("=== BẮT ĐẦU KIỂM THỬ PERMISSIONS & AUDIT OVERRIDE LOGS ===");
  console.log("=============================================================");

  const pool = await getPool();

  // Lấy các user test
  const adminRes = await pool.request().query("SELECT TOP 1 UserID FROM Users");
  const adminId = adminRes.recordset[0]?.UserID || 1;

  const mockAdminUser = { userId: adminId, role: "Admin" };
  const mockStaffUser = { userId: adminId + 1, role: "Staff" }; // Giả lập user tiếp theo làm Staff

  const createdTournaments: number[] = [];

  try {
    // 1. Khởi tạo giải đấu và division
    const code = "TCA_" + Date.now();
    const tourney = await tournamentService.createTournament({
      tournamentCode: code,
      tournamentName: "Test Permission " + code,
      registrationStart: "2026-07-01",
      registrationEnd: "2026-07-10",
      tournamentStart: "2026-07-15",
      tournamentEnd: "2026-07-20",
    }, adminId);
    createdTournaments.push(tourney.TournamentID);

    const div = await tournamentService.createDivision(tourney.TournamentID, {
      divisionName: "Nội dung Test Quyền",
      competitionFormat: "MenDoubles",
      ageGroup: "Open",
      maxTeams: 4,
      registrationFee: 0,
      bracketType: "RoundRobin",
    }, adminId);

    // Thêm 2 đội đấu
    for (let i = 1; i <= 2; i++) {
      const teamRes = await pool.request().query(`
        INSERT INTO TournamentTeams (TournamentID, DivisionID, TeamName, TeamStatus, CreatedBy, CreatedAt)
        OUTPUT INSERTED.TeamID
        VALUES (${tourney.TournamentID}, ${div.DivisionID}, N'Đội Test ${i}', 'Registered', ${adminId}, GETDATE())
      `);
      const teamId = teamRes.recordset[0].TeamID;

      await pool.request().query(`
        INSERT INTO TournamentRegistrations (TournamentID, DivisionID, TeamID, RegisteredBy, RegistrationStatus, PaymentStatus, RegisteredAt)
        VALUES (${tourney.TournamentID}, ${div.DivisionID}, ${teamId}, ${adminId}, 'Confirmed', 'Paid', GETDATE())
      `);
    }

    // Đóng đăng ký để sinh lịch
    await tournamentService.transitionDivisionStatus(div.DivisionID, DIVISION_STATUS.REGISTRATION_CLOSED, { adminOverride: true });
    
    // Sinh lịch thi đấu
    const matches = await tournamentService.generateRoundRobinMatches(tourney.TournamentID, div.DivisionID, adminId);
    const match = matches[0];
    console.log(` -> Đã sinh trận đấu test thành công. Trận ID: ${match.MatchID}, Trạng thái ban đầu: ${match.MatchStatus}`);

    // --- TEST 1: Staff start Scheduled không có adminOverride -> Phải bị chặn ---
    try {
      console.log("\n[TEST 1] Thử start Scheduled bởi Staff (không override)...");
      await tournamentService.startMatch(match.MatchID, mockStaffUser.userId, mockStaffUser.role, false);
      console.log("❌ FAIL: Staff start Scheduled không có override thành công (đáng lẽ phải bị chặn).");
    } catch (e: any) {
      console.log(`✔ PASS: Bị chặn thành công. Lỗi: ${e.message}`);
    }

    // --- TEST 2: Staff start Scheduled CÓ adminOverride -> Phải bị chặn ---
    try {
      console.log("\n[TEST 2] Thử start Scheduled bởi Staff (có override)...");
      await tournamentService.startMatch(match.MatchID, mockStaffUser.userId, mockStaffUser.role, true, "Staff test override");
      console.log("❌ FAIL: Staff start Scheduled có override thành công (đáng lẽ phải bị chặn).");
    } catch (e: any) {
      console.log(`✔ PASS: Bị chặn thành công. Lỗi: ${e.message}`);
    }

    // --- TEST 3: Admin start Scheduled CÓ adminOverride -> Phải thành công và ghi AuditLog ---
    console.log("\n[TEST 3] Thử start Scheduled bởi Admin (có override)...");
    const overrideReason = "Admin test override start";
    await tournamentService.startMatch(match.MatchID, mockAdminUser.userId, mockAdminUser.role, true, overrideReason);
    
    // Verify status
    const matchAfterStart = await tournamentRepo.findMatchDetail(match.MatchID);
    console.log(` -> Trạng thái sau khi start: ${matchAfterStart.MatchStatus} (Mong đợi: InProgress)`);
    if (matchAfterStart.MatchStatus !== MATCH_STATUS.IN_PROGRESS) {
      throw new Error("Trạng thái trận đấu không chuyển sang InProgress!");
    }

    // Verify Audit Log
    const logStart = await pool.request().query(`
      SELECT TOP 1 * FROM AuditLogs 
      WHERE ActionName = 'ADMIN_OVERRIDE_START_MATCH' AND EntityID = ${match.MatchID}
      ORDER BY CreatedAt DESC
    `);
    if (logStart.recordset.length === 0) {
      throw new Error("Không tìm thấy AuditLog cho ADMIN_OVERRIDE_START_MATCH!");
    }
    console.log("✔ PASS: Đã ghi nhận Audit Log cho ADMIN_OVERRIDE_START_MATCH thành công.");
    console.log(`    - Description: ${logStart.recordset[0].Description}`);

    // --- TEST 4: Kết thúc trận đấu thành Completed ---
    console.log("\n[Tiến trình] Báo cáo tỉ số lần đầu để chuyển trận đấu sang Completed...");
    await tournamentService.reportMatchScore(match.MatchID, {
      sets: [{ setNo: 1, teamAScore: 11, teamBScore: 5 }, { setNo: 2, teamAScore: 11, teamBScore: 5 }]
    }, mockAdminUser);
    
    const matchCompleted = await tournamentRepo.findMatchDetail(match.MatchID);
    console.log(` -> Trạng thái trận sau khi nhập điểm: ${matchCompleted.MatchStatus} (Mong đợi: Completed)`);

    // --- TEST 5: Staff sửa điểm trận Completed -> Phải bị chặn ---
    try {
      console.log("\n[TEST 5] Thử sửa điểm trận Completed bởi Staff (có override)...");
      await tournamentService.reportMatchScore(match.MatchID, {
        sets: [{ setNo: 1, teamAScore: 11, teamBScore: 8 }, { setNo: 2, teamAScore: 11, teamBScore: 8 }],
        adminOverride: true
      }, mockStaffUser);
      console.log("❌ FAIL: Staff sửa điểm trận Completed thành công (đáng lẽ phải bị chặn).");
    } catch (e: any) {
      console.log(`✔ PASS: Bị chặn thành công. Lỗi: ${e.message}`);
    }

    // --- TEST 6: Admin sửa điểm trận Completed -> Phải thành công và ghi AuditLog ---
    console.log("\n[TEST 6] Thử sửa điểm trận Completed bởi Admin (có override)...");
    const editReason = "Admin chỉnh sửa điểm sai sót của trọng tài";
    await tournamentService.reportMatchScore(match.MatchID, {
      sets: [{ setNo: 1, teamAScore: 11, teamBScore: 9 }, { setNo: 2, teamAScore: 11, teamBScore: 9 }],
      adminOverride: true,
      actionReason: editReason
    } as any, mockAdminUser);

    // Verify Score
    const matchFinal = await tournamentRepo.findMatchDetail(match.MatchID);
    console.log(` -> Tỉ số mới sau khi chỉnh sửa: ${matchFinal.ScoreText} (Mong đợi: 2-0 (11-9, 11-9))`);
    if (matchFinal.ScoreText !== "2-0 (11-9, 11-9)") {
      throw new Error(`Tỉ số không khớp! Thực tế: ${matchFinal.ScoreText}`);
    }

    // Verify Audit Log
    const logScore = await pool.request().query(`
      SELECT TOP 1 * FROM AuditLogs 
      WHERE ActionName = 'ADMIN_OVERRIDE_SCORE' AND EntityID = ${match.MatchID}
      ORDER BY CreatedAt DESC
    `);
    if (logScore.recordset.length === 0) {
      throw new Error("Không tìm thấy AuditLog cho ADMIN_OVERRIDE_SCORE!");
    }
    console.log("✔ PASS: Đã ghi nhận Audit Log cho ADMIN_OVERRIDE_SCORE thành công.");
    console.log(`    - Description: ${logScore.recordset[0].Description}`);

    console.log("\n=============================================================");
    console.log("🎉 TẤT CẢ CÁC TEST CASE PERMISSIONS & AUDIT ĐÃ THÀNH CÔNG! 🎉");
    console.log("=============================================================");

  } catch (error) {
    console.error("❌ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH TEST:");
    console.error(error);
  } finally {
    // Cleanup
    console.log("\n🧹 Dọn dẹp dữ liệu test...");
    for (const tid of createdTournaments) {
      await pool.request().query(`DELETE FROM AuditLogs WHERE TableName = 'TournamentMatches' AND EntityID IN (SELECT MatchID FROM TournamentMatches WHERE TournamentID = ${tid})`);
      await pool.request().query(`DELETE FROM TournamentMatchScores WHERE MatchID IN (SELECT MatchID FROM TournamentMatches WHERE TournamentID = ${tid})`);
      await pool.request().query(`DELETE FROM TournamentMatches WHERE TournamentID = ${tid}`);
      await pool.request().query(`DELETE FROM TournamentRegistrations WHERE TournamentID = ${tid}`);
      await pool.request().query(`DELETE FROM TournamentStandings WHERE TournamentID = ${tid}`);
      await pool.request().query(`DELETE FROM TournamentTeams WHERE TournamentID = ${tid}`);
      await pool.request().query(`DELETE FROM TournamentDivisions WHERE TournamentID = ${tid}`);
      await pool.request().query(`DELETE FROM Tournaments WHERE TournamentID = ${tid}`);
    }
    console.log("🧹 Dọn dẹp thành công.");
  }
}

runPermissionsTest().then(() => process.exit(0));
