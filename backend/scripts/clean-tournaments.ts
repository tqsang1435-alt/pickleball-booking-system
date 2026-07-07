import { getPool, sql } from "../src/database/connection";

async function cleanAllTournaments() {
  console.log("=== BẮT ĐẦU XÓA CÁC GIẢI ĐẤU TEST ĐỂ LÀM SẠCH DATABASE ===");
  const pool = await getPool();
  try {
    // Tắt tạm thời ràng buộc khóa ngoại hoặc xóa theo thứ tự phụ thuộc chính xác
    console.log("Đang xóa dữ liệu liên quan đến Tournaments...");
    
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

    console.log("Đã xóa sạch toàn bộ giải đấu, bảng đấu, đội, đăng ký và trận đấu test.");
  } catch (err: any) {
    console.error("Lỗi khi dọn dẹp giải đấu:", err.message);
  } finally {
    process.exit(0);
  }
}

cleanAllTournaments();
