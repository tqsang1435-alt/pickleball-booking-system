"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { tournamentApi, Tournament, TournamentDivision } from "@/services/tournamentApi";
import { getMyProfile } from "@/services/profileApi";
import { getPlayerProfile } from "@/services/matchingApi";
import "../../tournaments.css";

function PendingRegistrationBanner({ reg, handleRetryPayment, registerLoading, onExpired }: { reg: any; handleRetryPayment: any; registerLoading: boolean; onExpired: () => void }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!reg.PaymentExpiredAt) return;

    function tick() {
      const diff = new Date(reg.PaymentExpiredAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft("Hết hạn");
        onExpired();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes} phút ${seconds} giây`);
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [reg.PaymentExpiredAt, onExpired]);

  const isExpired = timeLeft === "Hết hạn";

  return (
    <div style={{
      background: "#fffbeb",
      border: "1px solid #fef3c7",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "20px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <span style={{ fontSize: "24px" }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: "750", color: "#92400e" }}>
            Đăng ký nội dung {reg.DivisionName} đang chờ thanh toán
          </h4>
          <p style={{ margin: "0", fontSize: "0.9rem", color: "#b45309", lineHeight: "1.5" }}>
            Bạn đã đăng ký tham gia nội dung <strong>{reg.DivisionName}</strong> với tên đội <strong>{reg.TeamName}</strong>. 
            Vui lòng hoàn tất thanh toán trong vòng 10 phút để giữ chỗ chính thức.
          </p>
          {timeLeft && (
            <p style={{ margin: "8px 0 0 0", fontSize: "0.875rem", fontWeight: "bold", color: "#ef4444" }}>
              ⏱️ Thời gian giữ chỗ còn lại: {timeLeft}
            </p>
          )}
          
          {/* Note section */}
          <div style={{ 
            fontSize: "0.8rem", 
            color: "#92400e", 
            background: "#fffbeb", 
            border: "1px solid #fde68a",
            borderRadius: "12px",
            padding: "12px 16px",
            marginTop: "12px",
            lineHeight: "1.5"
          }}>
            <strong style={{ color: "#92400e", display: "block", marginBottom: "4px" }}>⚠️ Lưu ý về quy định giải đấu:</strong>
            <ul style={{ margin: 0, paddingLeft: "16px" }}>
              <li>Nếu Ban tổ chức kiểm tra phát hiện điểm DUPR hoặc thông tin cá nhân khai báo không đúng sự thật, hồ sơ đăng ký sẽ bị <strong>Từ chối</strong> và Ban tổ chức sẽ thực hiện hoàn trả lệ phí theo quy chế.</li>
              <li>Trường hợp vận động viên chủ động hủy đăng ký sau khi đã thanh toán thành công sẽ <strong>Không được hoàn trả lệ phí</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px", borderTop: "1px solid #fde68a", paddingTop: "16px" }}>
        <button
          onClick={() => handleRetryPayment(reg.RegistrationID, reg.RegistrationFee)}
          disabled={registerLoading || isExpired}
          className="tm-btn tm-btn-primary"
          style={{ 
            padding: "10px 24px", 
            fontSize: "0.9rem",
            opacity: (registerLoading || isExpired) ? 0.6 : 1,
            cursor: (registerLoading || isExpired) ? "not-allowed" : "pointer",
            backgroundColor: isExpired ? "#cbd5e1" : undefined,
            color: isExpired ? "#64748b" : undefined
          }}
        >
          {registerLoading ? "Đang xử lý..." : isExpired ? "Đã hết hạn thanh toán" : `Thanh toán ngay (${reg.RegistrationFee.toLocaleString()} VNĐ)`}
        </button>
      </div>
    </div>
  );
}

function ConfirmedRegistrationBanner({ reg }: { reg: any }) {
  return (
    <div style={{
      background: "#f0fdf4",
      border: "1px solid #dcfce7",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "20px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      display: "flex",
      alignItems: "flex-start",
      gap: "12px"
    }}>
      <span style={{ fontSize: "24px" }}>✅</span>
      <div>
        <h4 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: "750", color: "#166534" }}>
          Đã đăng ký thành công nội dung {reg.DivisionName}
        </h4>
        <p style={{ margin: "0", fontSize: "0.9rem", color: "#15803d", lineHeight: "1.5" }}>
          Bạn đã đăng ký nội dung <strong>{reg.DivisionName}</strong> thành công (Mã đội: <strong>{reg.TeamCode}</strong>). 
          Trạng thái hồ sơ: <strong>Đã duyệt & Xác nhận tham gia</strong>.
        </p>
      </div>
    </div>
  );
}

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const routerParams = useParams();
  const id = (routerParams?.id as string) || "";
  const router = useRouter();
  const tournamentId = parseInt(id, 10);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [divisions, setDivisions] = useState<TournamentDivision[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "divisions" | "bracket" | "standings">("info");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Bracket & matches data
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);

  // Doubles registration state
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<TournamentDivision | null>(null);
  const [partnerOption, setPartnerOption] = useState<"ExistingPartner" | "SuggestOnly" | "AutoMatch" | "ManualForm">("ExistingPartner");
  const [partnerContact, setPartnerContact] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Mapped registration result details
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  // Form states for Athlete 1 and Athlete 2
  const [athlete1, setAthlete1] = useState({
    phoneNumber: "",
    fullName: "",
    rating: 0.0,
    province: "",
    gender: "Male",
    dateOfBirth: "",
    photoUrl: "",
    note: "",
    cccdUrl: "",
    transferUrl: "",
  });

  const [athlete2, setAthlete2] = useState({
    phoneNumber: "",
    fullName: "",
    rating: 0.0,
    province: "",
    gender: "Male",
    dateOfBirth: "",
    photoUrl: "",
    note: "",
  });

  // Form error highlights
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Payment redirection details
  const [paymentData, setPaymentData] = useState<any | null>(null);

  // User's active registrations status for this tournament
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);

  const refreshRegistrations = () => {
    tournamentApi.getMyRegistration(tournamentId)
      .then((data) => {
        setMyRegistrations(data || []);
      })
      .catch(() => {});

    tournamentApi.getDivisions(tournamentId)
      .then((divs) => {
        setDivisions(divs);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isNaN(tournamentId)) return;

    Promise.all([
      tournamentApi.getTournamentDetail(tournamentId),
      tournamentApi.getDivisions(tournamentId),
    ])
      .then(([tourn, divs]) => {
        setTournament(tourn);
        setDivisions(divs);
        if (divs.length > 0) {
          setSelectedDivisionId(divs[0].DivisionID);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể tải chi tiết giải đấu.");
      })
      .finally(() => setLoading(false));
  }, [tournamentId]);

  // Fetch my registration if logged in
  useEffect(() => {
    if (isNaN(tournamentId)) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("pickleclub_token") : null;
    if (!token) return;

    tournamentApi.getMyRegistration(tournamentId)
      .then((data) => {
        setMyRegistrations(data || []);
      })
      .catch((err) => {
        console.error("Error loading my registration status:", err);
      });
  }, [tournamentId]);

  useEffect(() => {
    if (!registerModalOpen) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("pickleclub_token") : null;
    if (!token) return;

    Promise.all([
      getMyProfile(token).catch(() => null),
      getPlayerProfile(token).catch(() => null)
    ]).then(([profileData, playerProfileData]) => {
      if (profileData) {
        setAthlete1(prev => ({
          ...prev,
          phoneNumber: profileData.PhoneNumber || "",
          fullName: profileData.FullName || "",
          gender: profileData.Gender === "Female" ? "Female" : "Male",
          dateOfBirth: profileData.DateOfBirth ? profileData.DateOfBirth.slice(0, 10) : "",
          rating: playerProfileData?.Rating ? Number(playerProfileData.Rating) : 0.0,
          province: profileData.Address || "",
        }));
      }
    });
  }, [registerModalOpen]);

  useEffect(() => {
    if (!selectedDivisionId) return;

    if (activeTab === "bracket") {
      tournamentApi
        .getMatches(tournamentId, selectedDivisionId)
        .then((data) => setMatches(data))
        .catch((err) => console.error("Error loading matches", err));
    } else if (activeTab === "standings") {
      tournamentApi
        .getStandings(tournamentId, selectedDivisionId)
        .then((data) => setStandings(data))
        .catch((err) => console.error("Error loading standings", err));
    }
  }, [selectedDivisionId, activeTab, tournamentId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const isSingles = selectedDivision?.CompetitionFormat === "MenSingles" || 
                      selectedDivision?.CompetitionFormat === "WomenSingles" || 
                      selectedDivision?.CompetitionFormat === "Singles";

    // Validate Athlete 1
    if (!athlete1.phoneNumber.trim()) {
      errors.phoneNumber1 = "Số điện thoại là bắt buộc";
    } else if (!/^\d{10}$/.test(athlete1.phoneNumber.trim())) {
      errors.phoneNumber1 = "Số điện thoại phải gồm 10 chữ số";
    }

    if (!athlete1.fullName.trim()) {
      errors.fullName1 = "Họ và tên là bắt buộc";
    }
    if (athlete1.rating === undefined || athlete1.rating === null || isNaN(athlete1.rating) || athlete1.rating <= 0) {
      errors.rating1 = "Điểm trình là bắt buộc và phải lớn hơn 0";
    }
    if (!athlete1.province.trim()) {
      errors.province1 = "Tỉnh thành là bắt buộc";
    }
    if (!athlete1.gender) {
      errors.gender1 = "Giới tính là bắt buộc";
    }
    if (!athlete1.dateOfBirth) {
      errors.dateOfBirth1 = "Ngày sinh là bắt buộc";
    }

    // Validate Athlete 2 (Doubles ManualForm option only)
    if (!isSingles && partnerOption === "ManualForm") {
      if (!athlete2.phoneNumber.trim()) {
        errors.phoneNumber2 = "Số điện thoại là bắt buộc";
      } else if (!/^\d{10}$/.test(athlete2.phoneNumber.trim())) {
        errors.phoneNumber2 = "Số điện thoại phải gồm 10 chữ số";
      }

      if (!athlete2.fullName.trim()) {
        errors.fullName2 = "Họ và tên là bắt buộc";
      }
      if (athlete2.rating === undefined || athlete2.rating === null || isNaN(athlete2.rating) || athlete2.rating <= 0) {
        errors.rating2 = "Điểm trình là bắt buộc và phải lớn hơn 0";
      }
      if (!athlete2.province.trim()) {
        errors.province2 = "Tỉnh thành là bắt buộc";
      }
      if (!athlete2.gender) {
        errors.gender2 = "Giới tính là bắt buộc";
      }
      if (!athlete2.dateOfBirth) {
        errors.dateOfBirth2 = "Ngày sinh là bắt buộc";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSingles = async (division: TournamentDivision) => {
    if (!validateForm()) {
      setError("Vui lòng điền đầy đủ và đúng định dạng các thông tin bắt buộc màu đỏ.");
      return;
    }
    setRegisterLoading(true);
    setError("");
    setSuccess("");
    try {
      const athletePayload = {
        athleteNo: 1,
        fullName: athlete1.fullName,
        phoneNumber: athlete1.phoneNumber,
        rating: Number(athlete1.rating),
        province: athlete1.province,
        gender: athlete1.gender,
        dateOfBirth: athlete1.dateOfBirth,
        photoUrl: athlete1.photoUrl || null,
        cccdUrl: athlete1.cccdUrl || null,
        note: athlete1.note || null,
      };

      const res = await tournamentApi.registerSingles(tournamentId, division.DivisionID, {
        athletes: [athletePayload],
      });

      setSuccess("Đăng ký nội dung đơn thành công!");
      setRegistrationResult(res.data);
      if (res.data?.registration?.RegistrationStatus === "PendingPayment" || res.data?.status === "Pending") {
        setPaymentData({
          registrationId: res.data.registration?.RegistrationID || res.data.payment?.RegistrationID,
          amount: division.RegistrationFee,
          checkoutUrl: res.data.checkoutUrl,
        });
      }
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRegisterDoubles = async () => {
    if (!selectedDivision) return;
    if (!validateForm()) {
      setError("Vui lòng điền đầy đủ và đúng định dạng các thông tin bắt buộc màu đỏ.");
      return;
    }
    setRegisterLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload: any = {
        partnerOption,
      };

      if (partnerOption === "ExistingPartner") {
        payload.partnerEmailOrPhone = partnerContact;
      } else if (partnerOption === "ManualForm") {
        payload.teamName = `${athlete1.fullName} - ${athlete2.fullName}`;
        payload.athletes = [
          {
            athleteNo: 1,
            fullName: athlete1.fullName,
            phoneNumber: athlete1.phoneNumber,
            rating: Number(athlete1.rating),
            province: athlete1.province,
            gender: athlete1.gender,
            dateOfBirth: athlete1.dateOfBirth,
            photoUrl: athlete1.photoUrl || null,
            cccdUrl: athlete1.cccdUrl || null,
            note: athlete1.note || null,
          },
          {
            athleteNo: 2,
            fullName: athlete2.fullName,
            phoneNumber: athlete2.phoneNumber,
            rating: Number(athlete2.rating),
            province: athlete2.province,
            gender: athlete2.gender,
            dateOfBirth: athlete2.dateOfBirth,
            photoUrl: athlete2.photoUrl || null,
            note: athlete2.note || null,
          }
        ];
      }

      const res = await tournamentApi.registerDoubles(tournamentId, selectedDivision.DivisionID, payload);
      setRegistrationResult(res.data);

      if (partnerOption === "SuggestOnly") {
        setSuggestions(res.data?.suggestedPartners || []);
        setSuccess("Đã tải danh sách gợi ý đồng đội. Hãy chọn một người chơi để gửi lời mời.");
      } else if (partnerOption === "AutoMatch") {
        setSuccess(res.data?.message || "Đăng ký ghép đôi tự động thành công.");
      } else {
        setSuccess("Gửi lời mời ghép cặp thành công. Đợi đồng đội đồng ý lời mời.");
        if ((res.data?.status === "Pending" || res.data?.registration?.RegistrationStatus === "PendingPayment") && (res.data?.checkoutUrl || res.data?.payment?.RegistrationID)) {
          setPaymentData({
            registrationId: res.data.payment?.RegistrationID || res.data.registration?.RegistrationID,
            amount: selectedDivision.RegistrationFee,
            checkoutUrl: res.data.checkoutUrl,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Đăng ký ghép cặp thất bại");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleSendPayOSPayment = async () => {
    if (!paymentData) return;
    setRegisterLoading(true);
    setError("");
    try {
      const res = await tournamentApi.createPayment(paymentData.registrationId, "PayOS");
      if (res && res.checkoutUrl) {
        setSuccess("Đang chuyển hướng sang cổng thanh toán VietQR PayOS...");
        setTimeout(() => {
          window.location.href = res.checkoutUrl;
        }, 1500);
      } else {
        throw new Error("Không nhận được liên kết thanh toán từ cổng PayOS.");
      }
    } catch (err: any) {
      setError(err.message || "Không thể khởi tạo liên kết thanh toán");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRetryPayment = async (registrationId: number, amount: number) => {
    setRegisterLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await tournamentApi.createPayment(registrationId, "PayOS");
      if (res && res.checkoutUrl) {
        setSuccess("Đang chuyển hướng sang cổng thanh toán VietQR PayOS...");
        setTimeout(() => {
          window.location.href = res.checkoutUrl;
        }, 1500);
      } else {
        throw new Error("Không nhận được liên kết thanh toán từ cổng PayOS.");
      }
    } catch (err: any) {
      setError(err.message || "Không thể khởi tạo liên kết thanh toán");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: "athlete1" | "athlete2" | "cccd" | "transfer") => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/tournaments/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload thất bại");

      const fileUrl = data.data.url;
      if (type === "athlete1") {
        setAthlete1(prev => ({ ...prev, photoUrl: fileUrl }));
      } else if (type === "athlete2") {
        setAthlete2(prev => ({ ...prev, photoUrl: fileUrl }));
      } else if (type === "cccd") {
        setAthlete1(prev => ({ ...prev, cccdUrl: fileUrl }));
      } else if (type === "transfer") {
        setAthlete1(prev => ({ ...prev, transferUrl: fileUrl }));
      }
    } catch (err: any) {
      alert("Lỗi upload file: " + err.message);
    }
  };

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

  if (loading) {
    return (
      <div className="tm-body min-h-screen flex flex-col items-center justify-center gap-4" style={{ height: "100vh" }}>
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Đang tải chi tiết giải đấu...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tm-body min-h-screen py-20 text-center">
        <p className="text-red-400 text-lg">Không tìm thấy thông tin giải đấu.</p>
      </div>
    );
  }

  return (
    <div className="tm-body min-h-screen pb-20">
      {/* Redesigned Premium Header Banner */}
      <div className="container" style={{ marginTop: "24px" }}>
        <div style={{ 
          width: "100%", 
          borderRadius: "24px", 
          overflow: "hidden", 
          position: "relative",
          background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
          padding: "56px 48px",
          color: "#ffffff",
          boxShadow: "0 20px 40px rgba(2, 44, 34, 0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          minHeight: "280px",
          justifyContent: "center",
          border: "1px solid #047857"
        }}>
          {/* Subtle Pickleball Graphic/Circle Background on the right */}
          <div style={{
            position: "absolute",
            right: "-50px",
            bottom: "-50px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(0, 0, 0, 0) 70%)",
            pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute",
            right: "8%",
            top: "12%",
            fontSize: "10rem",
            opacity: 0.05,
            fontWeight: 900,
            pointerEvents: "none",
            userSelect: "none"
          }}>
            🏓
          </div>

          {/* Badge */}
          <div style={{ display: "inline-block", alignSelf: "flex-start" }}>
            <span style={{ 
              background: "rgba(16, 185, 129, 0.2)", 
              color: "#34d399", 
              padding: "6px 16px", 
              borderRadius: "20px", 
              fontSize: "0.75rem", 
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "1px",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              backdropFilter: "blur(4px)"
            }}>
              MÙA GIẢI {new Date(tournament.StartDate || Date.now()).getFullYear()}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ 
            fontSize: "2.65rem", 
            fontWeight: "900", 
            margin: 0, 
            lineHeight: "1.2",
            color: "#ffffff",
            maxWidth: "850px"
          }}>
            {tournament.TournamentName}
          </h1>

          {/* Subtitle */}
          <p style={{ 
            fontSize: "1rem", 
            color: "#94a3b8", 
            margin: 0, 
            maxWidth: "700px", 
            lineHeight: "1.6"
          }}>
            {tournament.Description || "Sân chơi Pickleball chuyên nghiệp quy tụ những tay vợt hàng đầu. Tham gia ngay để khẳng định đẳng cấp."}
          </p>

          {/* Location and Date Specs */}
          <div style={{ 
            display: "flex", 
            gap: "24px", 
            flexWrap: "wrap", 
            marginTop: "16px",
            fontSize: "0.925rem",
            color: "#cbd5e1",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "20px"
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#34d399" }}>📅</span> <b>Thời gian:</b> {formatDate(tournament.StartDate)} - {formatDate(tournament.EndDate)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#34d399" }}>📍</span> <b>Địa điểm:</b> {tournament.Location}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#ef4444" }}>⏱️</span> <b>Hạn đăng ký:</b> {formatDate(tournament.RegistrationEnd)}
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: "32px" }}>
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl mb-6 text-sm text-center">
            {success}
          </div>
        )}

        {/* Tab Controls */}
        <div style={{ 
          display: "flex", 
          borderBottom: "1px solid #e2e8f0", 
          gap: "36px", 
          marginBottom: "32px", 
          padding: "0 8px",
          background: "transparent"
        }}>
          {[
            { id: "info", label: "Thông tin chi tiết" },
            { id: "divisions", label: "Nội dung & Đăng ký" },
            { id: "bracket", label: "Nhánh đấu / Lịch đấu" },
            { id: "standings", label: "Bảng xếp hạng" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: "transparent",
                border: "none",
                padding: "16px 4px",
                fontSize: "0.95rem",
                fontWeight: activeTab === tab.id ? "700" : "600",
                color: activeTab === tab.id ? "#047857" : "#64748b",
                cursor: "pointer",
                position: "relative",
                borderBottom: activeTab === tab.id ? "3px solid #059669" : "3px solid transparent",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === "info" && (
          <div className="tm-details-layout">
            <div className="tm-details-panel">
              <h3 className="tm-details-panel-title">Điều lệ và Quy định giải đấu</h3>
              <div style={{ color: "var(--tm-text)", fontSize: "0.9375rem", lineHeight: "1.7", whiteSpace: "pre-line" }}>
                {(tournament as any).PrizeInfo || "Quy định giải đấu chưa được ban tổ chức công bố."}
              </div>
            </div>

            <div className="tm-details-panel">
              <h3 className="tm-details-panel-title">Chi tiết tổ chức</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "0.875rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--tm-muted)", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Địa điểm thi đấu</span>
                  <p style={{ fontWeight: "700", marginTop: "4px", color: "var(--tm-text)" }}>{tournament.Location}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--tm-muted)", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Thời gian thi đấu</span>
                  <p style={{ fontWeight: "700", marginTop: "4px", color: "var(--tm-text)" }}>
                    {formatDate(tournament.StartDate)} - {formatDate(tournament.EndDate)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--tm-muted)", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Thời gian đăng ký</span>
                  <p style={{ fontWeight: "700", marginTop: "4px", color: "var(--tm-text)" }}>
                    {formatDate(tournament.RegistrationStart)} - {formatDate(tournament.RegistrationEnd)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--tm-muted)", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Nhà tổ chức</span>
                  <p style={{ fontWeight: "700", marginTop: "4px", color: "var(--tm-text)" }}>{tournament.OrganizerName}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "divisions" && (
          <div>
            {myRegistrations.filter(r => r.RegistrationStatus === "PendingPayment").map((reg) => (
              <PendingRegistrationBanner 
                key={reg.RegistrationID} 
                reg={reg} 
                handleRetryPayment={handleRetryPayment} 
                registerLoading={registerLoading} 
                onExpired={refreshRegistrations}
              />
            ))}

            {myRegistrations.filter(r => r.RegistrationStatus === "Confirmed").map((reg) => (
              <ConfirmedRegistrationBanner 
                key={reg.RegistrationID} 
                reg={reg} 
              />
            ))}

            {divisions.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", border: "1px solid var(--tm-border)", borderRadius: "16px", background: "#fff" }}>
                <p className="text-slate-400">Chưa cập nhật nội dung thi đấu cho giải này.</p>
              </div>
            ) : (
              <div>
                <div className="tm-div-grid" style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
                  gap: "24px", 
                  marginBottom: "40px" 
                }}>
                  {divisions.map((div) => {
                    const isSingles = div.CompetitionFormat === "MenSingles" || div.CompetitionFormat === "WomenSingles" || div.CompetitionFormat === "Singles";
                    const maxTeams = div.MaxTeams || 48;
                    const registeredCount = (div as any).RegisteredCount || 0;
                    const slotsLeft = Math.max(0, maxTeams - registeredCount);
                    const pct = Math.round((registeredCount / maxTeams) * 100);
                    
                    // Determine division badge name
                    let formatName = isSingles ? "Đơn" : "Đôi";
                    if (div.CompetitionFormat === "MenSingles") formatName = "Đơn Nam";
                    else if (div.CompetitionFormat === "WomenSingles") formatName = "Đơn Nữ";
                    else if (div.CompetitionFormat === "MenDoubles") formatName = "Đôi Nam";
                    else if (div.CompetitionFormat === "WomenDoubles") formatName = "Đôi Nữ";
                    else if (div.CompetitionFormat === "MixedDoubles") formatName = "Đôi Nam Nữ";
                    else if (div.CompetitionFormat === "Doubles") {
                      if (div.GenderRequirement === "MaleOnly") formatName = "Đôi Nam";
                      else if (div.GenderRequirement === "FemaleOnly") formatName = "Đôi Nữ";
                      else formatName = "Đôi Nam Nữ";
                    }

                    // Format fee nicely (e.g. 150k)
                    const feeK = div.RegistrationFee >= 1000 ? `${div.RegistrationFee / 1000}k` : div.RegistrationFee.toLocaleString();
                    const feeUnit = isSingles ? "NGƯỜI" : "ĐÔI";

                    // Determine progress text styling
                    const isFull = registeredCount >= maxTeams;
                    const isNearFull = pct >= 80;
                    const progressText = isFull 
                      ? "Hết chỗ!" 
                      : isNearFull 
                        ? `Sắp hết! (${pct}%)` 
                        : `${pct}% Full`;
                    const progressColor = isNearFull ? "#ef4444" : "#059669";

                    const myDivReg = myRegistrations.find(r => r.DivisionID === div.DivisionID);

                    return (
                      <div key={div.DivisionID} style={{
                        background: "#ffffff",
                        border: "1px solid #f1f5f9",
                        borderRadius: "24px",
                        padding: "28px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "20px"
                      }}>
                        <div>
                          {/* Card Top Row */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                            <span style={{ 
                              background: "#f0fdf4", 
                              color: "#166534", 
                              padding: "6px 12px", 
                              borderRadius: "20px", 
                              fontSize: "0.75rem", 
                              fontWeight: "750" 
                            }}>
                              {formatName}
                            </span>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ fontSize: "1.35rem", fontWeight: "950", color: "#0f172a", margin: 0 }}>
                                {feeK}
                              </p>
                              <p style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: "700", margin: "2px 0 0 0", letterSpacing: "0.5px" }}>
                                VNĐ / {feeUnit}
                              </p>
                            </div>
                          </div>

                          {/* Title */}
                          <h4 style={{ fontSize: "1.1rem", fontWeight: "800", margin: "0 0 16px 0", color: "#0f172a", lineHeight: "1.4" }}>
                            {div.DivisionName}
                          </h4>
                          
                          {/* Specs Grid */}
                          <div style={{ 
                            background: "#f8fafc", 
                            borderRadius: "16px", 
                            padding: "16px", 
                            display: "grid", 
                            gridTemplateColumns: "1fr 1fr", 
                            gap: "12px",
                            fontSize: "0.8rem",
                            color: "#334155"
                          }}>
                            <div>
                              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", marginBottom: "2px" }}>Giới tính:</span>
                              <strong style={{ color: "#0f172a" }}>
                                {div.GenderRequirement === "MaleOnly" ? "Nam" : div.GenderRequirement === "FemaleOnly" ? "Nữ" : "Nam/Nữ"}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", marginBottom: "2px" }}>Độ tuổi:</span>
                              <strong style={{ color: "#0f172a" }}>{div.AgeGroup}</strong>
                            </div>
                            <div>
                              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", marginBottom: "2px" }}>Giới hạn DUPR:</span>
                              <strong style={{ color: "#0f172a" }}>
                                {div.MinDUPR !== null ? `${div.MinDUPR} - ${div.MaxDUPR}` : "Open"}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", marginBottom: "2px" }}>Tối đa:</span>
                              <strong style={{ color: "#0f172a" }}>
                                {maxTeams} {isSingles ? "VĐV" : "Cặp"}
                              </strong>
                            </div>
                          </div>

                          {/* Progress bar info */}
                          <div style={{ marginTop: "18px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: "700", marginBottom: "6px" }}>
                              <span style={{ color: "#64748b" }}>Còn {slotsLeft} suất trống</span>
                              <span style={{ color: progressColor }}>{progressText}</span>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                              <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: progressColor, borderRadius: "10px" }} />
                            </div>
                          </div>
                        </div>

                        {/* Action button */}
                        {(() => {
                          const isExpired = new Date() > new Date(tournament.RegistrationEnd);
                          const isStatusClosed = tournament.Status !== "Open" && tournament.Status !== "Published";
                          const isButtonDisabled = !!myDivReg || isFull || isExpired || isStatusClosed;
                          
                          let buttonText = "Đăng ký tham gia →";
                          if (myDivReg) buttonText = "Đã đăng ký nội dung này";
                          else if (isStatusClosed) buttonText = tournament.Status === "DrawGenerated" ? "Đã chốt danh sách" : "Đã đóng đăng ký";
                          else if (isExpired) buttonText = "Đã quá hạn đăng ký";
                          else if (isFull) buttonText = "Đã hết suất đăng ký";

                          return (
                            <button
                              disabled={isButtonDisabled}
                          onClick={() => {
                            setSelectedDivision(div);
                            setRegisterModalOpen(true);
                          }}
                          className="tm-btn"
                          style={{ 
                            width: "100%", 
                            padding: "14px",
                            borderRadius: "14px",
                            background: isButtonDisabled ? "#cbd5e1" : "linear-gradient(135deg, #059669, #047857)",
                            color: isButtonDisabled ? "#64748b" : "#ffffff",
                            fontWeight: "700",
                            fontSize: "0.9rem",
                            border: "none",
                            cursor: isButtonDisabled ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: isButtonDisabled ? "none" : "0 4px 6px rgba(5, 150, 105, 0.15)",
                            transition: "all 0.2s"
                          }}
                        >
                          {buttonText}
                        </button>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Assistance Cards Grid */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
                  gap: "24px",
                  marginTop: "40px" 
                }}>
                  {/* Left Card: Partner Suggestion */}
                  <div style={{
                    background: "linear-gradient(135deg, #065f46, #064e3b)",
                    borderRadius: "24px",
                    padding: "36px",
                    color: "#ffffff",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "220px",
                    boxShadow: "0 10px 15px -3px rgba(5, 150, 105, 0.1)"
                  }}>
                    <div>
                      <h4 style={{ fontSize: "1.35rem", fontWeight: "900", margin: "0 0 10px 0" }}>
                        Bạn chưa có đồng đội?
                      </h4>
                      <p style={{ fontSize: "0.875rem", opacity: 0.9, lineHeight: "1.6", margin: 0, maxWidth: "400px" }}>
                        Đừng lo lắng! Tham gia cộng đồng tìm người chơi của chúng tôi để kết nối với những vợt thủ có cùng trình độ.
                      </p>
                    </div>
                    <button 
                      onClick={() => router.push("/matching")}
                      style={{
                        background: "#ffffff",
                        color: "#065f46",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "30px",
                        fontSize: "0.85rem",
                        fontWeight: "750",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        alignSelf: "flex-start",
                        marginTop: "20px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
                      }}
                    >
                      Tìm đồng đội ngay
                    </button>
                  </div>

                  {/* Right Card: Support details */}
                  <div style={{
                    background: "#f0fdf4",
                    border: "2px dashed #a7f3d0",
                    borderRadius: "24px",
                    padding: "36px",
                    color: "#064e3b",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    minHeight: "220px"
                  }}>
                    <span style={{ fontSize: "2.5rem", marginBottom: "12px" }}>❓</span>
                    <h4 style={{ fontSize: "1.2rem", fontWeight: "900", margin: "0 0 6px 0" }}>
                      Cần hỗ trợ?
                    </h4>
                    <p style={{ fontSize: "0.85rem", margin: "0 0 14px 0", color: "#047857" }}>
                      Liên hệ hotline giải đấu:<br />
                      <strong style={{ fontSize: "1.1rem", color: "#064e3b" }}>1900 1234 (24/7)</strong>
                    </p>
                    <a 
                      href="#" 
                      style={{ fontSize: "0.85rem", color: "#0284c7", fontWeight: "700", textDecoration: "underline" }}
                      onClick={(e) => e.preventDefault()}
                    >
                      Xem câu hỏi thường gặp
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "bracket" && (
          <div>
            {/* Division Selector */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "24px" }}>
              {divisions.map((div) => (
                <button
                  key={div.DivisionID}
                  onClick={() => setSelectedDivisionId(div.DivisionID)}
                  className={`tm-btn ${selectedDivisionId === div.DivisionID ? "tm-btn-primary" : "tm-btn-secondary"}`}
                  style={{ padding: "6px 16px", fontSize: "0.75rem" }}
                >
                  {div.DivisionName}
                </button>
              ))}
            </div>

            {matches.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", border: "1px solid var(--tm-border)", borderRadius: "16px", background: "#fff" }}>
                <p className="text-slate-400">Sơ đồ nhánh đấu và lịch thi đấu chưa được ban tổ chức tạo.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {matches.map((m) => (
                  <div key={m.MatchID} className="tm-match-card">
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                      <div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                          <span className="tm-badge tm-badge-draft" style={{ borderRadius: "4px" }}>
                            Vòng {m.RoundNo} - Trận {m.MatchNo}
                          </span>
                          {m.GroupName && (
                            <span style={{ fontSize: "0.65rem", color: "var(--tm-accent)", fontWeight: "bold", textTransform: "uppercase" }}>{m.GroupName}</span>
                          )}
                          <span className={`tm-badge ${m.MatchStatus === "Completed" ? "tm-badge-published" : "tm-badge-closed"}`}>
                            {m.MatchStatus}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "4px", minWidth: "220px" }}>
                          <p style={{ fontWeight: m.WinnerTeamID === m.TeamAID ? "bold" : "normal", color: m.WinnerTeamID === m.TeamAID ? "var(--tm-primary)" : "inherit" }}>
                            🔵 {m.TeamAName || "Đợi đối thủ..."}
                          </p>
                          <p style={{ fontWeight: m.WinnerTeamID === m.TeamBID ? "bold" : "normal", color: m.WinnerTeamID === m.TeamBID ? "var(--tm-primary)" : "inherit" }}>
                            🔴 {m.TeamBName || "Đợi đối thủ..."}
                          </p>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", fontSize: "0.75rem", borderLeft: "1px solid var(--tm-border)", paddingLeft: "16px" }}>
                        {m.CourtName && <p style={{ fontWeight: "700" }}>🏟️ {m.CourtName}</p>}
                        {m.ScheduledStart && (
                          <p style={{ color: "var(--tm-muted)", marginTop: "2px" }}>
                            ⏱️ {new Date(m.ScheduledStart).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                          </p>
                        )}
                        {m.ScoreText && (
                          <p style={{ color: "var(--tm-primary)", fontWeight: "bold", marginTop: "6px", background: "rgba(34,197,94,0.1)", padding: "4px 8px", borderRadius: "4px" }}>
                            🏆 Tỉ số: {m.ScoreText}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "standings" && (
          <div>
            {/* Division Selector */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "24px" }}>
              {divisions.map((div) => (
                <button
                  key={div.DivisionID}
                  onClick={() => setSelectedDivisionId(div.DivisionID)}
                  className={`tm-btn ${selectedDivisionId === div.DivisionID ? "tm-btn-primary" : "tm-btn-secondary"}`}
                  style={{ padding: "6px 16px", fontSize: "0.75rem" }}
                >
                  {div.DivisionName}
                </button>
              ))}
            </div>

            {standings.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", border: "1px solid var(--tm-border)", borderRadius: "16px", background: "#fff" }}>
                <p className="text-slate-400">Bảng xếp hạng rỗng hoặc nội dung này không áp dụng thể thức đấu vòng tròn.</p>
              </div>
            ) : (() => {
              const hasGroups = standings.some(st => st.GroupName);
              if (hasGroups) {
                const grouped: Record<string, any[]> = {};
                standings.forEach(st => {
                  const g = st.GroupName || "Chưa phân bảng";
                  if (!grouped[g]) grouped[g] = [];
                  grouped[g].push(st);
                });
                const sortedGroups = Object.keys(grouped).sort();
                const getGroupColor = (name: string) => {
                  const hash = name.charCodeAt(name.length - 1) || 0;
                  const hue = (hash * 37) % 360;
                  return `hsl(${hue}, 85%, 45%)`;
                };

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
                    {sortedGroups.map(g => (
                      <div key={g} style={{ border: "1px solid var(--tm-border)", borderRadius: "16px", padding: "20px", background: "#fff", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
                        <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "700", color: getGroupColor(g), borderBottom: `2px solid ${getGroupColor(g)}`, paddingBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>🏆 {g}</span>
                          <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", background: "#f1f5f9", borderRadius: "12px", color: "#64748b" }}>{grouped[g].length} Đội</span>
                        </h4>
                        <div className="tm-table-wrapper" style={{ boxShadow: "none", border: "none" }}>
                          <table className="tm-table">
                            <thead>
                              <tr>
                                <th>Hạng</th>
                                <th>Đội</th>
                                <th style={{ textAlign: "center" }}>Đã chơi</th>
                                <th style={{ textAlign: "center" }}>Thắng</th>
                                <th style={{ textAlign: "center" }}>Thua</th>
                                <th style={{ textAlign: "center" }}>Hiệu số</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grouped[g].map((st, idx) => (
                                <tr key={st.StandingID}>
                                  <td style={{ fontWeight: "bold", color: getGroupColor(g) }}>#{idx + 1}</td>
                                  <td style={{ fontWeight: "700" }}>{st.TeamName}</td>
                                  <td style={{ textAlign: "center" }}>{st.Played}</td>
                                  <td style={{ textAlign: "center", color: "#16a34a", fontWeight: "600" }}>{st.Won}</td>
                                  <td style={{ textAlign: "center", color: "#ef4444" }}>{st.Lost}</td>
                                  <td style={{ textAlign: "center", fontFamily: "monospace" }}>{st.PointDifference}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div className="tm-table-wrapper">
                  <table className="tm-table">
                    <thead>
                      <tr>
                        <th>Hạng</th>
                        <th>Đội thi đấu</th>
                        <th style={{ textAlign: "center" }}>Đã chơi</th>
                        <th style={{ textAlign: "center" }}>Thắng</th>
                        <th style={{ textAlign: "center" }}>Thua</th>
                        <th style={{ textAlign: "center" }}>Hiệu số điểm (+/-)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((st) => (
                        <tr key={st.StandingID}>
                          <td style={{ fontWeight: "bold", color: "var(--tm-primary)" }}>#{st.RankNo}</td>
                          <td style={{ fontWeight: "700" }}>{st.TeamName}</td>
                          <td style={{ textAlign: "center" }}>{st.Played}</td>
                          <td style={{ textAlign: "center", color: "#16a34a" }}>{st.Won}</td>
                          <td style={{ textAlign: "center", color: "#ef4444" }}>{st.Lost}</td>
                          <td style={{ textAlign: "center", fontFamily: "monospace" }}>{st.PointDifference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Register Modal */}
      {registerModalOpen && selectedDivision && (() => {
        const isSingles = selectedDivision.CompetitionFormat === "MenSingles" || 
                          selectedDivision.CompetitionFormat === "WomenSingles" || 
                          selectedDivision.CompetitionFormat === "Singles";
        const showAthlete2Form = !isSingles && partnerOption === "ManualForm";
        const maxTeams = selectedDivision.MaxTeams || 48;
        const registeredCount = (selectedDivision as any).RegisteredCount || 0;
        const paidCount = (selectedDivision as any).PaidCount || 0;
        
        // Progress circle calculation
        const fields1 = [
          athlete1.phoneNumber,
          athlete1.fullName,
          athlete1.rating,
          athlete1.province,
          athlete1.gender,
          athlete1.dateOfBirth,
          athlete1.photoUrl
        ];
        
        const fields2 = !isSingles && partnerOption === "ManualForm" ? [
          athlete2.phoneNumber,
          athlete2.fullName,
          athlete2.rating,
          athlete2.province,
          athlete2.gender,
          athlete2.dateOfBirth,
          athlete2.photoUrl
        ] : [];

        const allFields = [...fields1, ...fields2];
        const filled = allFields.filter(val => val !== undefined && val !== null && val !== "" && val !== 0 && val !== 0.0).length;
        const percentComplete = Math.round((filled / allFields.length) * 100) || 0;

        const inputStyle = {
          width: "100%",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "12px",
          color: "#0f172a",
          padding: "12px 16px",
          outline: "none",
          fontSize: "0.95rem",
          marginTop: "8px",
          height: "48px",
          transition: "all 0.2s"
        };

        const getInputStyle = (hasError: boolean) => ({
          ...inputStyle,
          borderColor: hasError ? "#ef4444" : "#cbd5e1",
          boxShadow: hasError ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "none"
        });

        return (
          <div className="tm-modal-backdrop" style={{ overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, padding: "20px" }}>
            <div className="tm-modal-content" style={{ 
              maxWidth: "1000px", 
              width: "100%", 
              margin: "auto",
              background: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh"
            }}>
              {/* Modal Header */}
              <div style={{
                background: "#ffffff",
                padding: "24px 32px",
                color: "#1e293b",
                position: "relative",
                borderBottom: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "#0f172a", textTransform: "uppercase" }}>
                    {tournament.TournamentName}
                  </h3>
                  <span style={{ 
                    background: "#047857", 
                    color: "#ffffff", 
                    padding: "4px 12px", 
                    borderRadius: "20px", 
                    fontSize: "0.75rem", 
                    fontWeight: "800",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ffffff", display: "inline-block" }}></span>
                    Đang mở đăng ký
                  </span>
                </div>
                <p style={{ margin: "6px 0 0 0", fontSize: "0.9rem", color: "#64748b", fontWeight: "600" }}>
                  Nội dung: {selectedDivision.DivisionName}
                </p>
                <button 
                  onClick={() => setRegisterModalOpen(false)}
                  style={{ 
                    position: "absolute", 
                    top: "24px", 
                    right: "32px", 
                    background: "transparent", 
                    border: "none", 
                    fontSize: "1.5rem", 
                    color: "#64748b", 
                    cursor: "pointer" 
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Grid Content Layout */}
              <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", flex: 1, overflow: "hidden" }}>
                
                {/* Left Sidebar */}
                <div style={{ 
                  background: "#f4f6fc", 
                  padding: "24px", 
                  borderRight: "1px solid #e2e8f0", 
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px"
                }}>
                  {/* Progress Card */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "24px 20px", borderRadius: "16px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                    <div style={{ position: "relative", width: "110px", height: "110px", margin: "0 auto 16px auto" }}>
                      <svg width="110" height="110" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="48" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle cx="60" cy="60" r="48" fill="none" stroke="#047857" strokeWidth="8" 
                                strokeDasharray={`${2 * Math.PI * 48}`} 
                                strokeDashoffset={`${2 * Math.PI * 48 * (1 - percentComplete / 100)}`} 
                                strokeLinecap="round" transform="rotate(-90 60 60)" />
                      </svg>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                        <p style={{ fontSize: "1.5rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>{percentComplete}%</p>
                        <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0, textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>Hoàn tất</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Tiến trình đăng ký</p>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0, lineHeight: "1.5" }}>Vui lòng điền đầy đủ các thông tin bắt buộc.</p>
                  </div>

                  {/* Details vertical list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontSize: "0.85rem", color: "#334155" }}>
                    <div>
                      <p style={{ margin: "0 0 6px 0", fontWeight: "700", color: "#64748b", fontSize: "0.75rem", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        ĐỊA ĐIỂM
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: "600", lineHeight: "1.4", paddingLeft: "22px" }}>{tournament.Location}</p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 6px 0", fontWeight: "700", color: "#64748b", fontSize: "0.75rem", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        THỜI GIAN
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: "600", paddingLeft: "22px" }}>{formatDate(tournament.StartDate)} - {formatDate(tournament.EndDate)}</p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 6px 0", fontWeight: "700", color: "#64748b", fontSize: "0.75rem", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        GIỚI HẠN DUPR
                      </p>
                      <p style={{ margin: 0, color: "#e11d48", fontWeight: "700", paddingLeft: "22px" }}>{selectedDivision.MinDUPR || 0.0} - {selectedDivision.MaxDUPR || 8.0}</p>
                    </div>
                  </div>

                  {/* Assistance section */}
                  <div style={{ 
                    marginTop: "auto", 
                    background: "#eefaf2", 
                    border: "1px solid #d1fae5", 
                    borderRadius: "16px", 
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}>
                    <p style={{ margin: 0, fontWeight: "800", color: "#047857", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      HỖ TRỢ ĐĂNG KÝ
                    </p>
                    <a 
                      href="https://zalo.me/g/745jaepg9znc0dxgb6lk" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        background: "#ffffff", 
                        padding: "12px", 
                        borderRadius: "12px", 
                        border: "1px solid #cbd5e1",
                        textDecoration: "none"
                      }}
                    >
                      <div style={{ 
                        background: "#0068ff", 
                        color: "#ffffff", 
                        fontWeight: "bold", 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "50%", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        fontSize: "1.1rem" 
                      }}>
                        Z
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: "700", color: "#0f172a" }}>Zalo: Amakirk Open</p>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "#64748b", fontWeight: "500" }}>Phản hồi trong 5 phút</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Right Form Content */}
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#ffffff" }}>
                  <div style={{ padding: "32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "28px" }}>
                    
                    {/* Registration Options (Doubles only) */}
                    {!isSingles && !paymentData && (
                      <div style={{ 
                        background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", 
                        padding: "20px", 
                        borderRadius: "16px", 
                        border: "1px solid #cbd5e1" 
                      }}>
                        <label className="tm-form-label" style={{ marginBottom: "12px", fontWeight: "800", color: "#1e293b", fontSize: "0.9rem" }}>
                          Tùy chọn tìm kiếm đồng đội
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                          {[
                            { id: "ExistingPartner", label: "Đã có đồng đội (Mời qua SĐT/Email)" },
                            { id: "SuggestOnly", label: "Hệ thống gợi ý đồng đội phù hợp DUPR" },
                            { id: "AutoMatch", label: "Hệ thống tự ghép đồng đội" },
                            { id: "ManualForm", label: "Tự điền thông tin cả 2 (Đăng ký trực tiếp)" },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setPartnerOption(opt.id as any);
                                setSuccess("");
                                setError("");
                              }}
                              className={`tm-btn ${partnerOption === opt.id ? "tm-btn-primary" : "tm-btn-secondary"}`}
                              style={{ 
                                padding: "10px 14px", 
                                fontSize: "0.8rem", 
                                textAlign: "left", 
                                display: "block", 
                                width: "100%",
                                borderRadius: "10px",
                                fontWeight: "600"
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {partnerOption === "ExistingPartner" && (
                          <div style={{ marginTop: "16px" }}>
                            <label className="tm-form-label" style={{ fontWeight: "700" }}>Email hoặc Số điện thoại đồng đội *</label>
                            <input
                              type="text"
                              className="tm-form-input"
                              placeholder="Nhập email hoặc số điện thoại đồng đội để hệ thống gửi lời mời..."
                              value={partnerContact}
                              onChange={(e) => setPartnerContact(e.target.value)}
                              style={{ borderRadius: "8px", marginTop: "6px" }}
                            />
                          </div>
                        )}

                        {partnerOption === "SuggestOnly" && (
                          <div style={{ marginTop: "16px" }}>
                            <button type="button" onClick={handleRegisterDoubles} className="tm-btn tm-btn-accent" style={{ fontSize: "0.8rem", padding: "8px 16px", borderRadius: "8px" }}>
                              Tìm gợi ý đồng đội phù hợp DUPR
                            </button>
                            {suggestions.length > 0 && (
                              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                                {suggestions.map((p) => (
                                  <div key={p.UserID} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.8rem" }}>
                                    <div>
                                      <p style={{ fontWeight: "750", margin: 0, color: "#0f172a" }}>{p.FullName}</p>
                                      <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "2px 0 0 0" }}>DUPR: <strong style={{ color: "#e11d48" }}>{p.DUPR}</strong> | Giới tính: {p.Gender === "Male" ? "Nam" : "Nữ"}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPartnerContact(p.Email || p.PhoneNumber);
                                        setPartnerOption("ExistingPartner");
                                      }}
                                      className="tm-btn tm-btn-primary"
                                      style={{ padding: "6px 12px", fontSize: "0.75rem", borderRadius: "6px" }}
                                    >
                                      Chọn mời
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Messages */}
                    {error && <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", color: "#b91c1c", padding: "14px", borderRadius: "12px", fontSize: "0.875rem", fontWeight: "600" }}>⚠️ {error}</div>}
                    {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "14px", borderRadius: "12px", fontSize: "0.875rem", fontWeight: "600" }}>✅ {success}</div>}

                    {paymentData ? (
                      /* Payment Details Flow */
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center", padding: "12px 0" }}>
                        <div style={{ 
                          background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)", 
                          border: "1px solid #a7f3d0", 
                          padding: "24px", 
                          borderRadius: "16px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
                        }}>
                          <p style={{ fontWeight: "800", fontSize: "1rem", color: "#065f46", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Yêu cầu thanh toán lệ phí giải</p>
                          <p style={{ fontSize: "2.5rem", fontWeight: "950", color: "#059669", margin: "14px 0" }}>
                            {paymentData.amount.toLocaleString()} VNĐ
                          </p>
                          <div style={{ background: "#fff", border: "1px dashed #f59e0b", padding: "12px", borderRadius: "8px", display: "inline-block", margin: "0 auto" }}>
                            <p style={{ fontSize: "0.8rem", color: "#b45309", fontWeight: "700", margin: 0 }}>
                              ⚠️ Lưu ý: Vé giữ chỗ sẽ bị hủy tự động nếu không thanh toán trong 10 phút.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={handleSendPayOSPayment} 
                          disabled={registerLoading} 
                          className="tm-btn tm-btn-primary" 
                          style={{ 
                            width: "100%", 
                            padding: "14px", 
                            fontSize: "0.95rem", 
                            fontWeight: "bold",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            border: "none",
                            boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)",
                            borderRadius: "12px",
                            cursor: "pointer"
                          }}
                        >
                          {registerLoading ? "Đang kết nối cổng..." : "Thanh toán VietQR qua cổng PayOS (Nhận Link ngay)"}
                        </button>
                        <button onClick={() => setPaymentData(null)} style={{ fontSize: "0.8rem", color: "#64748b", background: "transparent", cursor: "pointer", border: "none", textDecoration: "underline", fontWeight: "600" }}>
                          Quay lại chỉnh sửa thông tin
                        </button>
                      </div>
                    ) : (
                      /* Normal Form Fields Flow */
                      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                        {/* Athlete 1 Form Block */}
                        <div>
                          <h4 style={{ 
                            fontSize: "1.1rem", 
                            fontWeight: "800", 
                            color: "#0f172a", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px", 
                            borderBottom: "1px solid #f1f5f9", 
                            paddingBottom: "12px", 
                            marginBottom: "24px" 
                          }}>
                            <span style={{ color: "#047857", display: "inline-flex", alignItems: "center" }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </span>
                            Thông tin vận động viên {isSingles ? "" : "1 (Trưởng nhóm)"}
                          </h4>
                          
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                            <div className="tm-form-group">
                              <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Số điện thoại *</label>
                              <input 
                                type="text" 
                                placeholder="090 123 4567" 
                                style={getInputStyle(!!formErrors.phoneNumber1)} 
                                value={athlete1.phoneNumber} 
                                onChange={(e) => setAthlete1({ ...athlete1, phoneNumber: e.target.value })} 
                                required 
                              />
                              {formErrors.phoneNumber1 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.phoneNumber1}</span>}
                            </div>
                            
                            <div className="tm-form-group">
                              <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Họ và tên *</label>
                              <input 
                                type="text" 
                                placeholder="Nguyễn Văn A" 
                                style={getInputStyle(!!formErrors.fullName1)} 
                                value={athlete1.fullName} 
                                onChange={(e) => setAthlete1({ ...athlete1, fullName: e.target.value })} 
                                required 
                              />
                              {formErrors.fullName1 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.fullName1}</span>}
                            </div>
                            
                            <div className="tm-form-group">
                              <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Điểm DUPR *</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                placeholder="4.50" 
                                style={getInputStyle(!!formErrors.rating1)} 
                                value={athlete1.rating || ""} 
                                onChange={(e) => setAthlete1({ ...athlete1, rating: Number(e.target.value) })} 
                                required 
                              />
                              <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "6px", display: "block", fontStyle: "italic", lineHeight: "1.4" }}>
                                Vui lòng cung cấp điểm DUPR chính xác nhất tính đến ngày đăng ký.
                              </span>
                              {formErrors.rating1 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.rating1}</span>}
                            </div>
                            
                            <div className="tm-form-group">
                              <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Tỉnh/Thành phố *</label>
                              <select 
                                style={getInputStyle(!!formErrors.province1)} 
                                value={athlete1.province} 
                                onChange={(e) => setAthlete1({ ...athlete1, province: e.target.value })} 
                                required
                              >
                                <option value="">Chọn tỉnh thành</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Quảng Nam">Quảng Nam</option>
                                <option value="Khánh Hòa">Khánh Hòa</option>
                                <option value="Lâm Đồng">Lâm Đồng</option>
                                <option value="Khác">Tỉnh thành khác</option>
                              </select>
                              {formErrors.province1 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.province1}</span>}
                            </div>
                            
                            <div className="tm-form-group">
                              <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Giới tính *</label>
                              <div style={{ display: "flex", gap: "24px", height: "48px", alignItems: "center" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", cursor: "pointer", color: "#334155", fontWeight: "500" }}>
                                  <input 
                                    type="radio" 
                                    name="gender1" 
                                    value="Male" 
                                    checked={athlete1.gender === "Male"} 
                                    onChange={() => setAthlete1({ ...athlete1, gender: "Male" })} 
                                    style={{ width: "20px", height: "20px", accentColor: "#047857", cursor: "pointer" }}
                                  />
                                  Nam
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", cursor: "pointer", color: "#334155", fontWeight: "500" }}>
                                  <input 
                                    type="radio" 
                                    name="gender1" 
                                    value="Female" 
                                    checked={athlete1.gender === "Female"} 
                                    onChange={() => setAthlete1({ ...athlete1, gender: "Female" })} 
                                    style={{ width: "20px", height: "20px", accentColor: "#047857", cursor: "pointer" }}
                                  />
                                  Nữ
                                </label>
                              </div>
                              {formErrors.gender1 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.gender1}</span>}
                            </div>
                            
                            <div className="tm-form-group">
                              <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Ngày sinh *</label>
                              <input 
                                type="date" 
                                style={getInputStyle(!!formErrors.dateOfBirth1)} 
                                value={athlete1.dateOfBirth} 
                                onChange={(e) => setAthlete1({ ...athlete1, dateOfBirth: e.target.value })} 
                                required 
                              />
                              {formErrors.dateOfBirth1 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.dateOfBirth1}</span>}
                            </div>

                            {/* Avatar dashed upload box */}
                            <div className="tm-form-group" style={{ gridColumn: "span 2" }}>
                              <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Ảnh chân dung vận động viên *</label>
                              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "athlete1")} style={{ display: "none" }} id="avatar-1-upload" />
                              <label htmlFor="avatar-1-upload" style={{ 
                                display: "flex", 
                                flexDirection: "column", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                padding: "40px 28px", 
                                border: "2px dashed #b2c0cc", 
                                borderRadius: "16px", 
                                cursor: "pointer", 
                                background: "#ffffff",
                                marginTop: "8px",
                                transition: "all 0.2s"
                              }}>
                                {athlete1.photoUrl ? (
                                  <div style={{ textAlign: "center" }}>
                                    <img src={athlete1.photoUrl} alt="Avatar 1" style={{ width: "120px", height: "120px", borderRadius: "12px", objectFit: "cover", marginBottom: "12px" }} />
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#047857", fontWeight: "700" }}>Thay đổi ảnh chân dung</p>
                                  </div>
                                ) : (
                                  <div style={{ textAlign: "center" }}>
                                    <div style={{ 
                                      width: "56px", 
                                      height: "56px", 
                                      borderRadius: "50%", 
                                      background: "#f0fdf4", 
                                      display: "flex", 
                                      alignItems: "center", 
                                      justifyContent: "center", 
                                      margin: "0 auto 16px auto" 
                                    }}>
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                        <line x1="21" y1="9" x2="21" y2="15" />
                                        <line x1="18" y1="12" x2="24" y2="12" />
                                      </svg>
                                    </div>
                                    <p style={{ margin: "0 0 6px 0", fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>
                                      Kéo thả ảnh hoặc <span style={{ color: "#047857", textDecoration: "underline", fontWeight: "700" }}>Tải lên</span>
                                    </p>
                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                                      Định dạng JPG, PNG. Tối đa 5MB. Ảnh rõ mặt.
                                    </p>
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Athlete 2 Form Block (Doubles only) */}
                        {showAthlete2Form && (
                          <div style={{ marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "32px" }}>
                            <h4 style={{ 
                              fontSize: "1.1rem", 
                              fontWeight: "800", 
                              color: "#0f172a", 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "8px", 
                              borderBottom: "1px solid #f1f5f9", 
                              paddingBottom: "12px", 
                              marginBottom: "24px" 
                            }}>
                              <span style={{ color: "#047857", display: "inline-flex", alignItems: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </span>
                              Thông tin đồng đội (Vận động viên 2)
                            </h4>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                              <div className="tm-form-group">
                                <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Số điện thoại *</label>
                                <input 
                                  type="text" 
                                  placeholder="090 123 4567" 
                                  style={getInputStyle(!!formErrors.phoneNumber2)} 
                                  value={athlete2.phoneNumber} 
                                  onChange={(e) => setAthlete2({ ...athlete2, phoneNumber: e.target.value })} 
                                  required 
                                />
                                {formErrors.phoneNumber2 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.phoneNumber2}</span>}
                              </div>
                              
                              <div className="tm-form-group">
                                <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Họ và tên *</label>
                                <input 
                                  type="text" 
                                  placeholder="Nguyễn Văn B" 
                                  style={getInputStyle(!!formErrors.fullName2)} 
                                  value={athlete2.fullName} 
                                  onChange={(e) => setAthlete2({ ...athlete2, fullName: e.target.value })} 
                                  required 
                                />
                                {formErrors.fullName2 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.fullName2}</span>}
                              </div>
                              
                              <div className="tm-form-group">
                                <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Điểm DUPR *</label>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="4.50" 
                                  style={getInputStyle(!!formErrors.rating2)} 
                                  value={athlete2.rating || ""} 
                                  onChange={(e) => setAthlete2({ ...athlete2, rating: Number(e.target.value) })} 
                                  required 
                                />
                                <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "6px", display: "block", fontStyle: "italic", lineHeight: "1.4" }}>
                                  Vui lòng cung cấp điểm DUPR chính xác nhất tính đến ngày đăng ký.
                                </span>
                                {formErrors.rating2 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.rating2}</span>}
                              </div>
                              
                              <div className="tm-form-group">
                                <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Tỉnh/Thành phố *</label>
                                <select 
                                  style={getInputStyle(!!formErrors.province2)} 
                                  value={athlete2.province} 
                                  onChange={(e) => setAthlete2({ ...athlete2, province: e.target.value })} 
                                  required
                                >
                                  <option value="">Chọn tỉnh thành</option>
                                  <option value="Đà Nẵng">Đà Nẵng</option>
                                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                  <option value="Hà Nội">Hà Nội</option>
                                  <option value="Quảng Nam">Quảng Nam</option>
                                  <option value="Khánh Hòa">Khánh Hòa</option>
                                  <option value="Lâm Đồng">Lâm Đồng</option>
                                  <option value="Khác">Tỉnh thành khác</option>
                                </select>
                                {formErrors.province2 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.province2}</span>}
                              </div>
                              
                              <div className="tm-form-group">
                                <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Giới tính *</label>
                                <div style={{ display: "flex", gap: "24px", height: "48px", alignItems: "center" }}>
                                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", cursor: "pointer", color: "#334155", fontWeight: "500" }}>
                                    <input 
                                      type="radio" 
                                      name="gender2" 
                                      value="Male" 
                                      checked={athlete2.gender === "Male"} 
                                      onChange={() => setAthlete2({ ...athlete2, gender: "Male" })} 
                                      style={{ width: "20px", height: "20px", accentColor: "#047857", cursor: "pointer" }}
                                    />
                                    Nam
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", cursor: "pointer", color: "#334155", fontWeight: "500" }}>
                                    <input 
                                      type="radio" 
                                      name="gender2" 
                                      value="Female" 
                                      checked={athlete2.gender === "Female"} 
                                      onChange={() => setAthlete2({ ...athlete2, gender: "Female" })} 
                                      style={{ width: "20px", height: "20px", accentColor: "#047857", cursor: "pointer" }}
                                    />
                                    Nữ
                                  </label>
                                </div>
                                {formErrors.gender2 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.gender2}</span>}
                              </div>
                              
                              <div className="tm-form-group">
                                <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Ngày sinh *</label>
                                <input 
                                  type="date" 
                                  style={getInputStyle(!!formErrors.dateOfBirth2)} 
                                  value={athlete2.dateOfBirth} 
                                  onChange={(e) => setAthlete2({ ...athlete2, dateOfBirth: e.target.value })} 
                                  required 
                                />
                                {formErrors.dateOfBirth2 && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{formErrors.dateOfBirth2}</span>}
                              </div>

                              {/* Avatar dashed upload box 2 */}
                              <div className="tm-form-group" style={{ gridColumn: "span 2" }}>
                                <label className="tm-form-label" style={{ fontWeight: "600", color: "#334155" }}>Ảnh chân dung đồng đội *</label>
                                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "athlete2")} style={{ display: "none" }} id="avatar-2-upload" />
                                <label htmlFor="avatar-2-upload" style={{ 
                                  display: "flex", 
                                  flexDirection: "column", 
                                  alignItems: "center", 
                                  justifyContent: "center", 
                                  padding: "40px 28px", 
                                  border: "2px dashed #b2c0cc", 
                                  borderRadius: "16px", 
                                  cursor: "pointer", 
                                  background: "#ffffff",
                                  marginTop: "8px",
                                  transition: "all 0.2s"
                                }}>
                                  {athlete2.photoUrl ? (
                                    <div style={{ textAlign: "center" }}>
                                      <img src={athlete2.photoUrl} alt="Avatar 2" style={{ width: "120px", height: "120px", borderRadius: "12px", objectFit: "cover", marginBottom: "12px" }} />
                                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#047857", fontWeight: "700" }}>Thay đổi ảnh chân dung</p>
                                    </div>
                                  ) : (
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ 
                                        width: "56px", 
                                        height: "56px", 
                                        borderRadius: "50%", 
                                        background: "#f0fdf4", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center", 
                                        margin: "0 auto 16px auto" 
                                      }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                          <circle cx="12" cy="13" r="4" />
                                          <line x1="21" y1="9" x2="21" y2="15" />
                                          <line x1="18" y1="12" x2="24" y2="12" />
                                        </svg>
                                      </div>
                                      <p style={{ margin: "0 0 6px 0", fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>
                                        Kéo thả ảnh hoặc <span style={{ color: "#047857", textDecoration: "underline" }}>Tải lên</span>
                                      </p>
                                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                                        Định dạng JPG, PNG. Tối đa 5MB. Ảnh rõ mặt.
                                      </p>
                                    </div>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Policy Disclaimer */}
                    <div style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "16px",
                      padding: "20px",
                      marginTop: "24px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      textAlign: "left"
                    }}>
                      <span style={{ fontSize: "20px" }}>⚠️</span>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: "0 0 6px 0", fontSize: "0.875rem", fontWeight: "750", color: "#92400e" }}>
                          Điều khoản & Quy định thanh toán lệ phí giải đấu
                        </h5>
                        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.8rem", color: "#b45309", lineHeight: "1.5" }}>
                          <li>Trong trường hợp phát hiện điểm DUPR hoặc thông tin cá nhân khai báo không chính xác, Ban tổ chức sẽ <strong>Từ chối hồ sơ</strong> và thực hiện hoàn tiền theo quy chế giải đấu.</li>
                          <li>Trường hợp vận động viên chủ động hủy đăng ký sau khi đã thanh toán thành công sẽ <strong>Không được hoàn trả lệ phí</strong> dưới mọi hình thức.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  {!paymentData && (
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      padding: "20px 32px", 
                      borderTop: "1px solid #e2e8f0", 
                      background: "#ffffff" 
                    }}>
                      {/* Left side: Fee card */}
                      <div style={{ 
                        background: "#f1f5f9", 
                        padding: "8px 20px", 
                        borderRadius: "12px", 
                        display: "flex", 
                        flexDirection: "column",
                        gap: "2px"
                      }}>
                        <span style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lệ phí dự kiến</span>
                        <span style={{ fontSize: "1.15rem", fontWeight: "900", color: "#047857" }}>
                          {selectedDivision.RegistrationFee.toLocaleString()} VNĐ
                        </span>
                      </div>

                      {/* Right side: Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <button 
                          type="button" 
                          onClick={() => setRegisterModalOpen(false)} 
                          style={{ 
                            background: "transparent", 
                            border: "none", 
                            color: "#64748b", 
                            fontWeight: "700", 
                            fontSize: "0.9rem", 
                            cursor: "pointer" 
                          }}
                        >
                          Hủy
                        </button>
                        
                        <button 
                          type="button" 
                          onClick={() => setRegisterModalOpen(false)} 
                          style={{ 
                            background: "#ffffff", 
                            border: "1px solid #cbd5e1", 
                            color: "#334155", 
                            padding: "10px 24px", 
                            borderRadius: "30px", 
                            fontSize: "0.9rem", 
                            fontWeight: "700", 
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          💾 Lưu nháp
                        </button>

                        <button 
                          type="button" 
                          onClick={() => isSingles ? handleRegisterSingles(selectedDivision) : handleRegisterDoubles()}
                          disabled={registerLoading}
                          style={{ 
                            background: "#047857", 
                            color: "#ffffff", 
                            border: "none", 
                            padding: "12px 28px", 
                            borderRadius: "30px", 
                            fontSize: "0.9rem", 
                            fontWeight: "800", 
                            cursor: "pointer",
                            boxShadow: "0 4px 6px rgba(4, 120, 87, 0.2)" 
                          }}
                        >
                          {registerLoading ? "Đang xử lý..." : "Hoàn tất đăng ký"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
