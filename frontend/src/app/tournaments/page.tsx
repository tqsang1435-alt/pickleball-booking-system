"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { tournamentApi, Tournament, TournamentDivision } from "@/services/tournamentApi";
import { getUser } from "@/utils/authStorage";
import "../tournaments.css";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [divisionsMap, setDivisionsMap] = useState<Record<number, TournamentDivision[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formatFilter, setFormatFilter] = useState("ALL");
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check Admin authorization from localStorage
    const currentUser = getUser();
    if (currentUser) {
      const role = String(currentUser.RoleName || currentUser.role || currentUser.roles?.[0] || "").toLowerCase();
      setIsAdmin(role.includes("admin"));
    }

    tournamentApi
      .getTournaments()
      .then(async (data) => {
        // Active tournaments for player view
        const activeTourns = data.filter((t) => t.Status !== "Draft");
        setTournaments(activeTourns);

        // Fetch divisions for each tournament to show metadata tags
        const divPromises = activeTourns.map(async (t) => {
          try {
            const divs = await tournamentApi.getDivisions(t.TournamentID);
            return { id: t.TournamentID, divs };
          } catch {
            return { id: t.TournamentID, divs: [] };
          }
        });

        const resolvedDivs = await Promise.all(divPromises);
        const newMap: Record<number, TournamentDivision[]> = {};
        for (const item of resolvedDivs) {
          newMap[item.id] = item.divs;
        }
        setDivisionsMap(newMap);
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể tải danh sách giải đấu. Vui lòng thử lại sau.");
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Chưa cập nhật";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Chưa cập nhật";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
      case "Published":
        return <span className="tm-badge tm-badge-published">Đang mở đăng ký</span>;
      case "Closed":
        return <span className="tm-badge tm-badge-closed">Đóng đăng ký</span>;
      case "Ongoing":
        return <span className="tm-badge" style={{ background: "#dbeafe", color: "#1e40af", borderColor: "#bfdbfe", padding: "4px 12px", fontSize: "0.75rem", fontWeight: "600", borderRadius: "9999px", border: "1px solid" }}>Đang diễn ra</span>;
      case "Completed":
        return <span className="tm-badge" style={{ background: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1", padding: "4px 12px", fontSize: "0.75rem", fontWeight: "600", borderRadius: "9999px", border: "1px solid" }}>Đã kết thúc</span>;
      case "Cancelled":
        return <span className="tm-badge tm-badge-cancelled">Đã hủy</span>;
      default:
        return <span className="tm-badge tm-badge-draft">{status}</span>;
    }
  };

  // Filter Logic
  const filtered = tournaments.filter((t) => {
    // Search keyword
    const matchKeyword =
      t.TournamentName.toLowerCase().includes(search.toLowerCase()) ||
      t.Location.toLowerCase().includes(search.toLowerCase());
    
    // Status
    let matchStatus = false;
    if (statusFilter === "ALL") {
      matchStatus = true;
    } else if (statusFilter === "RegistrationClosed" || statusFilter === "Closed") {
      matchStatus = t.Status === "RegistrationClosed" || t.Status === "Closed";
    } else {
      matchStatus = t.Status === statusFilter;
    }

    // Divisions properties
    const tDivs = divisionsMap[t.TournamentID] || [];
    
    // Format
    const matchFormat =
      formatFilter === "ALL" ||
      tDivs.some((d) => d.CompetitionFormat === formatFilter);

    // Skill level
    const matchSkill =
      skillFilter === "ALL" ||
      tDivs.some((d) => {
        if (skillFilter === "Under4.0") return (d.MaxDUPR || 0) < 4.0;
        if (skillFilter === "Above4.0") return (d.MinDUPR || 0) >= 4.0;
        return true;
      });

    // Date
    const matchDate =
      !dateFilter ||
      new Date(t.StartDate) >= new Date(dateFilter);

    return matchKeyword && matchStatus && matchFormat && matchSkill && matchDate;
  });

  const featuredTournament = filtered.find((t) => t.Status === "Open" || t.Status === "Published");

  return (
    <div className="tm-body min-h-screen pb-16">
      {/* Hero Banner Section */}
      <div className="tm-hero-custom">
        <div className="container tm-hero-container">
          <div className="tm-hero-left">
            <span className="tm-season-badge">Mùa giải 2026</span>
            <h1 className="tm-hero-title-new">
              Giải Đấu <span>Pickleball</span> 2026
            </h1>
            <p className="tm-hero-desc">
              Tham gia tranh tài tại các giải đấu chuyên nghiệp và phong trào lớn nhất của hệ thống PickleClub. 
              Cơ hội giao lưu, nâng hạng DUPR và giành những giải thưởng hấp dẫn!
            </p>
            <div style={{ display: "flex", gap: "16px" }}>
              <button 
                onClick={() => {
                  const el = document.getElementById("tournament-list-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="tm-btn tm-btn-primary" 
                style={{ borderRadius: "12px", padding: "12px 28px", fontWeight: "700" }}
              >
                Khám phá giải đấu
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById("featured-tournament-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="tm-btn tm-btn-secondary" 
                style={{ borderRadius: "12px", padding: "12px 28px", fontWeight: "700", border: "1.5px solid #cbd5e1" }}
              >
                Xem giải nổi bật
              </button>
            </div>
          </div>
          <div className="tm-hero-right">
            <img 
              src="/images/tournament_banner_2026_4_3.jpg" 
              alt="Pickleball 2026" 
              className="tm-hero-img"
              style={{
                maxWidth: "540px",
                width: "100%",
                height: "auto",
                borderRadius: "16px",
                boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                border: "1px solid #cbd5e1"
              }}
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: "40px" }}>
        
        {/* Featured Tournament Card Section */}
        {featuredTournament && (
          <div id="featured-tournament-section" className="tm-featured-container">
            <div className="tm-featured-grid">
              {/* Left Column: Information */}
              <div className="tm-featured-left">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                    <span style={{ color: "#eab308", fontSize: "1.2rem" }}>★</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#059669", letterSpacing: "1px", textTransform: "uppercase" }}>
                      GIẢI ĐẤU NỔI BẬT
                    </span>
                  </div>
                  
                  <h2 style={{ fontSize: "2.1rem", fontWeight: "900", color: "#0f172a", marginBottom: "16px", textTransform: "uppercase", lineHeight: "1.2" }}>
                    {featuredTournament.TournamentName}
                  </h2>
                  
                  <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "24px" }}>
                    {featuredTournament.Description || "Giải đấu quy tụ những vận động viên xuất sắc nhất khu vực, với giải thưởng lớn. Hệ thống tính điểm DUPR chuẩn quốc tế."}
                  </p>
                  
                  {/* Specs Grid */}
                  <div className="tm-spec-grid">
                    <div className="tm-spec-item">
                      <div className="tm-spec-icon">📍</div>
                      <div>
                        <div className="tm-spec-label">Địa điểm</div>
                        <div className="tm-spec-val">{featuredTournament.Location}</div>
                      </div>
                    </div>
                    <div className="tm-spec-item">
                      <div className="tm-spec-icon">📅</div>
                      <div>
                        <div className="tm-spec-label">Thời gian</div>
                        <div className="tm-spec-val">{formatDate(featuredTournament.StartDate)} - {formatDate(featuredTournament.EndDate)}</div>
                      </div>
                    </div>
                    <div className="tm-spec-item">
                      <div className="tm-spec-icon tm-spec-icon-red">⏰</div>
                      <div>
                        <div className="tm-spec-label">Hạn đăng ký</div>
                        <div className="tm-spec-val tm-spec-val-red">{formatDate(featuredTournament.RegistrationEnd)}</div>
                      </div>
                    </div>
                    <div className="tm-spec-item">
                      <div className="tm-spec-icon">👥</div>
                      <div>
                        <div className="tm-spec-label">Nội dung</div>
                        <div className="tm-spec-val">
                          {divisionsMap[featuredTournament.TournamentID]?.map(d => d.DivisionName).join(", ") || "Đơn & Đôi Nam/Nữ"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer of Left Column */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "24px", marginTop: "20px" }}>
                  <div className="tm-tags-row">
                    <span className="tm-tag-pill">DUPR 3.0+</span>
                    <span className="tm-tag-pill">OPEN</span>
                    <span className="tm-tag-pill">U35</span>
                  </div>
                  <Link 
                    href={`/tournaments/${featuredTournament.TournamentID}`} 
                    className="tm-btn tm-btn-primary" 
                    style={{ padding: "12px 36px", borderRadius: "12px", fontWeight: "800" }}
                  >
                    Đăng ký ngay
                  </Link>
                </div>
              </div>

              {/* Right Column: Image */}
              <div className="tm-featured-right">
                <img 
                  src="/images/cogai.png" 
                  alt="Featured Tournament" 
                  className="tm-featured-img"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div id="tournament-list-section" className="tm-actions-bar" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          {/* Search Input Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div className="tm-search-wrapper" style={{ flex: 1, minWidth: "280px" }}>
              <span className="tm-search-icon" style={{ left: "16px", fontSize: "1.1rem" }}>🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm tên giải đấu hoặc địa điểm..."
                className="tm-search-input"
                style={{ padding: "12px 16px 12px 48px", borderRadius: "12px", border: "1px solid #cbd5e1" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isAdmin && (
              <Link href="/admin/tournaments" className="tm-btn tm-btn-accent" style={{ display: "inline-flex", gap: "6px", borderRadius: "12px", padding: "12px 24px" }}>
                ⚙️ Bảng Quản Trị
              </Link>
            )}
          </div>

          {/* Selector Filters Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "16px", alignItems: "center" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", display: "block", marginBottom: "6px", color: "#475569" }}>Trạng thái</label>
              <select className="tm-form-select" style={{ borderRadius: "12px", height: "42px", borderColor: "#cbd5e1" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Open">Đang mở đăng ký</option>
                <option value="RegistrationClosed">Đã đóng đăng ký</option>
                <option value="Ongoing">Đang diễn ra</option>
                <option value="Completed">Đã kết thúc</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", display: "block", marginBottom: "6px", color: "#475569" }}>Hình thức đấu</label>
              <select className="tm-form-select" style={{ borderRadius: "12px", height: "42px", borderColor: "#cbd5e1" }} value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
                <option value="ALL">Tất cả hình thức</option>
                <option value="MenSingles">Đơn Nam</option>
                <option value="WomenSingles">Đơn Nữ</option>
                <option value="MenDoubles">Đôi Nam</option>
                <option value="WomenDoubles">Đôi Nữ</option>
                <option value="MixedDoubles">Đôi Nam Nữ</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", display: "block", marginBottom: "6px", color: "#475569" }}>Trình độ DUPR</label>
              <select className="tm-form-select" style={{ borderRadius: "12px", height: "42px", borderColor: "#cbd5e1" }} value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
                <option value="ALL">Tất cả trình độ</option>
                <option value="Under4.0">Dưới 4.0 DUPR</option>
                <option value="Above4.0">Từ 4.0 DUPR trở lên</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", display: "block", marginBottom: "6px", color: "#475569" }}>Từ ngày</label>
              <input type="date" className="tm-form-input" style={{ borderRadius: "12px", height: "42px", borderColor: "#cbd5e1" }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", height: "42px", marginTop: "20px" }}>
              <button 
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setFormatFilter("ALL");
                  setSkillFilter("ALL");
                  setDateFilter("");
                }}
                className="tm-btn" 
                style={{ background: "transparent", color: "#059669", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}
              >
                🔄 Đặt lại bộ lọc
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-8 text-center text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Đang tải danh sách giải đấu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center", border: "1px solid #e2e8f0", borderRadius: "20px", background: "#ffffff" }}>
            <p className="text-slate-500 font-semibold">Không tìm thấy giải đấu nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="tm-grid">
            {filtered.map((t) => {
              const tournDivs = divisionsMap[t.TournamentID] || [];
              const minFee = tournDivs.length > 0 ? Math.min(...tournDivs.map(d => d.RegistrationFee)) : 0;
              const isOpen = t.Status === "Open" || t.Status === "Published";
              const isOngoing = t.Status === "Ongoing";
              const isClosed = t.Status === "Closed" || t.Status === "RegistrationClosed";

              
              // Dynamic banner background illustration index
              const bannerImages = [
                "/images/courts/court1.jpg",
                "/images/court_illustration.png",
                "/images/summer_cup_banner.png"
              ];
              const bannerSrc = (t as any).BannerUrl || (t as any).bannerUrl || bannerImages[t.TournamentID % 3];

              let statusText = "Đã đóng đăng ký";
              let statusClass = "tm-status-closed";
              if (isOpen) {
                statusText = "Đang mở đăng ký";
                statusClass = "tm-status-open";
              } else if (isOngoing) {
                statusText = "Đang diễn ra";
                statusClass = "tm-status-ongoing";
              } else if (t.Status === "DrawGenerated") {
                statusText = "Đã chốt danh sách";
                statusClass = "tm-status-closed";
              } else if (t.Status === "Cancelled") {
                statusText = "Đã hủy";
                statusClass = "tm-status-closed"; // You can use closed style or make a red one
              } else if (t.Status === "Completed") {
                statusText = "Đã kết thúc";
                statusClass = "tm-status-closed";
              }

              return (
                <div key={t.TournamentID} className="tm-card-new">
                  <div>
                    {/* Visual Tournament Banner Image */}
                    <div className="tm-card-image-wrap">
                      <img 
                        src={bannerSrc} 
                        alt={t.TournamentName} 
                        className="tm-card-banner-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/court_illustration.png";
                        }}
                      />
                      {/* Status Overlay Badge */}
                      <span className={`tm-card-status-badge ${statusClass}`} style={isOngoing ? { background: "#3b82f6", color: "#fff" } : {}}>
                        {statusText}
                      </span>
                      {/* ID tag overlay */}
                      <span className="tm-card-id-badge">
                        ID: PC2026-{String(t.TournamentID).padStart(3, "0")}
                      </span>
                    </div>

                    <h3 className="tm-card-title" style={{ fontSize: "1.2rem", fontWeight: "850", color: "#0f172a", marginBottom: "8px" }}>
                      {t.TournamentName}
                    </h3>
                    
                    <p className="tm-card-desc" style={{ fontSize: "0.85rem", color: "#64748b", height: "42px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", textOverflow: "ellipsis", marginBottom: "16px" }}>
                      {t.Description || "Giải đấu phong trào định kỳ hàng tháng nhằm tạo sân chơi cọ xát cho cộng đồng Pickleball..."}
                    </p>

                    <div className="tm-info-list" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginBottom: "16px" }}>
                      <div className="tm-info-item-new">
                        <span>📍</span>
                        <span style={{ fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.Location}
                        </span>
                      </div>
                      <div className="tm-info-item-new">
                        <span>📅</span>
                        <span>{formatDate(t.StartDate)} - {formatDate(t.EndDate)}</span>
                      </div>
                      <div className="tm-info-item-new">
                        <span>💰</span>
                        <span style={{ color: isOpen ? "#059669" : "#64748b", fontWeight: "800" }}>
                          {isOpen ? `Lệ phí từ: ${minFee.toLocaleString()} VNĐ` : (isOngoing ? "Đang thi đấu" : (t.Status === "DrawGenerated" ? "Đã chốt danh sách" : (t.Status === "Cancelled" ? "Đã hủy" : (t.Status === "Completed" ? "Đã kết thúc" : "Hết chỗ đăng ký"))))}
                        </span>
                      </div>
                    </div>

                    {tournDivs.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                        {tournDivs.slice(0, 3).map((d) => (
                          <span key={d.DivisionID} className="tm-tag-pill" style={{ fontSize: "0.68rem", padding: "4px 8px" }}>
                            {d.DivisionName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    {isOpen ? (
                      <Link 
                        href={`/tournaments/${t.TournamentID}`} 
                        className="tm-btn tm-btn-primary-outline" 
                        style={{ width: "100%", borderRadius: "12px", padding: "12px", fontWeight: "750", fontSize: "0.875rem" }}
                      >
                        Chi tiết & Đăng ký →
                      </Link>
                    ) : (
                      <Link 
                        href={`/tournaments/${t.TournamentID}`} 
                        className="tm-btn tm-btn-gray-filled" 
                        style={{ width: "100%", borderRadius: "12px", padding: "12px", fontWeight: "750", fontSize: "0.875rem", display: "inline-block", textAlign: "center" }}
                      >
                        Xem kết quả bốc thăm →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination bar */}
        {!loading && filtered.length > 0 && (
          <div className="tm-pagination">
            <button className="tm-page-btn" style={{ fontWeight: "700" }}>‹</button>
            <button className="tm-page-btn tm-page-btn-active">1</button>
            <button className="tm-page-btn">2</button>
            <button className="tm-page-btn">3</button>
            <button className="tm-page-btn" style={{ cursor: "default" }}>...</button>
            <button className="tm-page-btn">10</button>
            <button className="tm-page-btn" style={{ fontWeight: "700" }}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
