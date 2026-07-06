"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { 
  FaBrain, 
  FaSyncAlt, 
  FaChartLine, 
  FaList, 
  FaDatabase, 
  FaSlidersH,
  FaCheck,
  FaTimes,
  FaBullhorn
} from "react-icons/fa";
import styles from "./AIAnaDashboard.module.css";
import {
  getOccupancyForecasts,
  getPromotionRecommendations,
  updateRecommendationStatus,
  triggerManualAI,
  getAIModelLogs,
  getAccuracyMetrics,
  type OccupancyForecastData,
  type PromotionRecommendationData,
  type AIModelLogData,
  type AccuracyMetricSummary
} from "@/services/admin-ai.service";

export default function AIAnaDashboard() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [threshold, setThreshold] = useState<number>(50);
  const [basePrice, setBasePrice] = useState<number>(200000);
  
  // Data States
  const [forecasts, setForecasts] = useState<OccupancyForecastData[]>([]);
  const [recommendations, setRecommendations] = useState<PromotionRecommendationData[]>([]);
  const [logs, setLogs] = useState<AIModelLogData[]>([]);
  const [accuracy, setAccuracy] = useState<AccuracyMetricSummary[]>([]);
  const [editingRecs, setEditingRecs] = useState<Record<number, { discount: number; marketingMessage: string }>>({});
  
  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [manualLoading, setManualLoading] = useState<boolean>(false);
  const [selectedCourt, setSelectedCourt] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"forecasts" | "recommendations" | "accuracy" | "logs">("forecasts");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const getBoostForDiscount = (d: number) => {
    if (d <= 0) return 0;
    if (d <= 10) return 15;
    if (d <= 20) return 30;
    if (d <= 35) return 45;
    return 55;
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = async (targetDate: string) => {
    setLoading(true);
    try {
      const [forecastRes, recRes] = await Promise.all([
        getOccupancyForecasts(targetDate),
        getPromotionRecommendations(targetDate)
      ]);
      setForecasts(forecastRes);
      setRecommendations(recRes);
    } catch (error: any) {
      showToast(error.message || "Lỗi tải dữ liệu AI", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadSecondaryData = async () => {
    try {
      const [logsRes, accRes] = await Promise.all([
        getAIModelLogs(50),
        getAccuracyMetrics()
      ]);
      setLogs(logsRes);
      setAccuracy(accRes.summary || []);
    } catch (error: any) {
      console.error("Failed to load secondary monitoring data:", error);
    }
  };

  useEffect(() => {
    loadData(date);
  }, [date]);

  useEffect(() => {
    if (activeTab === "logs" || activeTab === "accuracy") {
      loadSecondaryData();
    }
  }, [activeTab]);

  const handleStatusUpdate = async (
    id: number,
    newStatus: "Approved" | "Rejected",
    customDiscount?: number,
    customMarketingMessage?: string
  ) => {
    try {
      const result = await updateRecommendationStatus(id, newStatus, customDiscount, customMarketingMessage);
      if (result.success) {
        showToast(`Đề xuất đã được ${newStatus === "Approved" ? "Duyệt" : "Từ chối"}`);
        // Refresh local recommendations
        setRecommendations(prev => 
          prev.map(r => r.RecommendationID === id ? { 
            ...r, 
            Status: newStatus,
            SuggestedDiscount: customDiscount !== undefined ? customDiscount : r.SuggestedDiscount,
            MarketingMessage: customMarketingMessage !== undefined ? customMarketingMessage : r.MarketingMessage,
            UpdatedAt: new Date().toISOString() 
          } : r)
        );
      }
    } catch (error: any) {
      showToast(error.message || "Không thể cập nhật trạng thái", "error");
    }
  };

  const handleManualTrigger = async () => {
    setManualLoading(true);
    try {
      showToast("Đang kích hoạt quy trình huấn luyện & dự báo AI...");
      const res = await triggerManualAI(date, threshold, basePrice);
      showToast(res.message || "Kích hoạt AI thành công!");
      await loadData(date);
      if (activeTab === "logs" || activeTab === "accuracy") {
        await loadSecondaryData();
      }
    } catch (error: any) {
      showToast(error.message || "Lỗi khi chạy AI thủ công", "error");
    } finally {
      setManualLoading(false);
    }
  };

  // Processing chart data
  const uniqueCourts = Array.from(new Set(forecasts.map(f => String(f.CourtID))));
  
  // Format hourly chart data
  const chartHours = Array.from({ length: 18 }, (_, i) => i + 5); // 5:00 - 22:00
  const chartData = chartHours.map(hour => {
    const row: any = { hour: `${hour}h` };
    let sum = 0;
    let count = 0;

    uniqueCourts.forEach(courtId => {
      const forecast = forecasts.find(f => String(f.CourtID) === courtId && f.HourStart === hour);
      const rate = forecast ? forecast.PredictedRate : null;
      if (rate !== null) {
        row[`Sân ${courtId}`] = rate;
        sum += rate;
        count++;
      }
    });

    row["Trung bình"] = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
    return row;
  });

  // Filter recommendations that are in the past if date is today
  const filteredRecommendations = recommendations.filter((rec) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (date !== todayStr) return true;
    
    // Parse starting hour, e.g., "05" from "05:00-06:00"
    const startHour = parseInt(rec.TargetHourRange.split(":")[0], 10);
    const currentHour = new Date().getHours();
    return startHour > currentHour;
  });

  // Calculate KPIs
  const avgOccupancy = forecasts.length > 0 
    ? (forecasts.reduce((sum, f) => sum + f.PredictedRate, 0) / forecasts.length).toFixed(1)
    : "0.0";
  const promoCount = filteredRecommendations.length;
  const activePromoCount = filteredRecommendations.filter(r => r.Status === "Approved" || r.Status === "Implemented").length;
  const modelVersion = forecasts[0]?.ModelVersion || "N/A";

  return (
    <div className={styles.container}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : ""}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <FaBrain style={{ marginRight: 8, verticalAlign: "middle" }} />
            Hệ Thống Tối Ưu Lấp Đầy & Khuyến Mãi AI
          </h1>
          <p>Dự báo công suất sân dựa trên Machine Learning & Đề xuất tiếp thị qua Generative AI</p>
        </div>
        <div className={styles.controls}>
          <input 
            type="date" 
            className={styles.datePicker} 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
          <button 
            className={styles.btnPrimary} 
            onClick={handleManualTrigger}
            disabled={manualLoading}
          >
            <FaSyncAlt className={manualLoading ? "spin" : ""} />
            {manualLoading ? "Đang xử lý..." : "Chạy AI Thủ Công"}
          </button>
        </div>
      </header>

      {/* KPI Stats */}
      <section className={styles.kpiGrid}>
        <div className={`${styles.glassCard} ${styles.kpiCard}`}>
          <div className={styles.kpiIconWrapper}>
            <FaChartLine />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Tỷ Lệ Lấp Đầy Dự Báo</span>
            <span className={styles.kpiValue}>{avgOccupancy}%</span>
          </div>
        </div>

        <div className={`${styles.glassCard} ${styles.kpiCard}`}>
          <div className={styles.kpiIconWrapper}>
            <FaBullhorn />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Khuyến Mãi Đề Xuất</span>
            <span className={styles.kpiValue}>{promoCount} chương trình</span>
          </div>
        </div>

        <div className={`${styles.glassCard} ${styles.kpiCard}`}>
          <div className={styles.kpiIconWrapper}>
            <FaCheck />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Khuyến Mãi Đã Duyệt</span>
            <span className={styles.kpiValue}>{activePromoCount} hoạt động</span>
          </div>
        </div>

        <div className={`${styles.glassCard} ${styles.kpiCard}`}>
          <div className={styles.kpiIconWrapper}>
            <FaDatabase />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Phiên Bản Mô Hình</span>
            <span className={styles.kpiValue} style={{ fontSize: 13, fontFamily: "monospace" }}>{modelVersion}</span>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className={styles.dashboardSplit}>
        {/* Left Interactive panel */}
        <section className={styles.glassCard}>
          <div className={styles.tabBar}>
            <button 
              className={`${styles.tabItem} ${activeTab === "forecasts" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("forecasts")}
            >
              <FaChartLine style={{ marginRight: 6 }} /> Biểu Đồ Lấp Đầy
            </button>
            <button 
              className={`${styles.tabItem} ${activeTab === "recommendations" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("recommendations")}
            >
              <FaList style={{ marginRight: 6 }} /> Đề Xuất Khuyến Mãi AI ({promoCount})
            </button>
            <button 
              className={`${styles.tabItem} ${activeTab === "accuracy" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("accuracy")}
            >
              <FaBrain style={{ marginRight: 6 }} /> Đối Soát Sai Số ML
            </button>
            <button 
              className={`${styles.tabItem} ${activeTab === "logs" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("logs")}
            >
              <FaDatabase style={{ marginRight: 6 }} /> Log Hoạt Động AI
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <span>Đang tải thông tin...</span>
            </div>
          ) : (
            <>
              {/* Tab 1: Forecast Chart */}
              {activeTab === "forecasts" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h3 className={styles.panelTitle}>Xu Hướng Dự Báo Tỷ Lệ Lấp Đầy Ngày {date}</h3>
                    <select 
                      className={styles.datePicker} 
                      value={selectedCourt} 
                      onChange={(e) => setSelectedCourt(e.target.value)}
                    >
                      <option value="All">Tất cả các sân</option>
                      {uniqueCourts.map(cid => (
                        <option key={cid} value={cid}>Sân {cid}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorSingle" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d946ef" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#d946ef" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="hour" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" unit="%" domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f1f5f9" }}
                        />
                        <Legend />
                        {selectedCourt === "All" ? (
                          <>
                            <Area 
                              type="monotone" 
                              dataKey="Trung bình" 
                              stroke="#6366f1" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorOccupancy)" 
                            />
                            {uniqueCourts.map((cid, idx) => (
                              <Area
                                key={cid}
                                type="monotone"
                                dataKey={`Sân ${cid}`}
                                stroke={`hsl(${idx * 70 + 200}, 70%, 60%)`}
                                strokeWidth={1}
                                strokeDasharray="4 4"
                                fill="none"
                              />
                            ))}
                          </>
                        ) : (
                          <Area 
                            type="monotone" 
                            dataKey={`Sân ${selectedCourt}`} 
                            stroke="#d946ef" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorSingle)" 
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 2: Recommendations List */}
              {activeTab === "recommendations" && (
                <div className={styles.recsList}>
                  <h3 className={styles.panelTitle}>Khuyến Nghị Giá Ưu Đãi Động & Tiếp Thị Tự Động</h3>
                  {filteredRecommendations.length === 0 ? (
                    <div className={styles.emptyState}>Không có khung giờ nào dưới ngưỡng {threshold}% cần áp dụng khuyến mãi.</div>
                  ) : (
                    filteredRecommendations.map((rec) => {
                      const currentDiscount = editingRecs[rec.RecommendationID]?.discount ?? rec.SuggestedDiscount;
                      const currentMarketingMessage = editingRecs[rec.RecommendationID]?.marketingMessage ?? rec.MarketingMessage;
                      const activeBoost = getBoostForDiscount(currentDiscount);

                      return (
                        <div className={styles.recItem} key={rec.RecommendationID}>
                          <div className={styles.recHeader}>
                            <span className={styles.recTime}>
                              ⏰ Khung giờ: {rec.TargetHourRange}
                            </span>
                            <span className={`${styles.badge} ${
                              rec.Status === "Approved" ? styles.badgeApproved :
                              rec.Status === "Rejected" ? styles.badgeRejected :
                              rec.Status === "Implemented" ? styles.badgeImplemented : styles.badgeSuggested
                            }`}>
                              {rec.Status}
                            </span>
                            {rec.Status === "Suggested" ? (
                              <span className={styles.recDiscountEdit}>
                                Giảm giá:{" "}
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={currentDiscount}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                    setEditingRecs(prev => ({
                                      ...prev,
                                      [rec.RecommendationID]: {
                                        marketingMessage: prev[rec.RecommendationID]?.marketingMessage ?? currentMarketingMessage,
                                        discount: val
                                      }
                                    }));
                                  }}
                                  className={styles.discountInput}
                                />
                                %
                              </span>
                            ) : (
                              <span className={styles.recDiscount}>
                                Giảm giá {rec.SuggestedDiscount}%
                              </span>
                            )}
                          </div>

                          <div className={styles.recGrid}>
                            <div className={styles.recTextContent}>
                              <div>
                                <span className={styles.recLabel}>Lý do đề xuất (AI Reasoning)</span>
                                <div className={styles.recVal}>{rec.Reasoning}</div>
                              </div>
                              <div style={{ marginTop: 10 }}>
                                <span className={styles.recLabel}>Tin nhắn tiếp thị SMS/Zalo kích cầu</span>
                                {rec.Status === "Suggested" ? (
                                  <textarea
                                    value={currentMarketingMessage}
                                    onChange={(e) => {
                                      setEditingRecs(prev => ({
                                        ...prev,
                                        [rec.RecommendationID]: {
                                          discount: prev[rec.RecommendationID]?.discount ?? currentDiscount,
                                          marketingMessage: e.target.value
                                        }
                                      }));
                                    }}
                                    className={styles.marketingTextarea}
                                  />
                                ) : (
                                  <div className={styles.recVal} style={{ fontStyle: "italic", background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 6, borderLeft: "3px solid #d946ef" }}>
                                    {rec.MarketingMessage}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className={styles.recStats}>
                              <div className={styles.statRow}>
                                <span className={styles.statLabel}>Tăng lấp đầy dự kiến:</span>
                                <span className={styles.statVal} style={{ color: "#4ade80", fontWeight: "bold" }}>
                                  +{activeBoost}%
                                </span>
                              </div>
                              <div className={styles.statRow}>
                                <span className={styles.statLabel}>Tăng doanh thu dự kiến:</span>
                                <span className={styles.statVal} style={{ color: "#38bdf8", fontWeight: "bold" }}>
                                  +{(activeBoost * 0.01 * basePrice).toLocaleString("vi-VN")}đ/giờ
                                </span>
                              </div>
                            </div>
                          </div>

                          {rec.Status === "Suggested" && (
                            <div className={styles.recActions}>
                              <button 
                                className={`${styles.btnSecondary} ${styles.btnReject}`}
                                onClick={() => handleStatusUpdate(rec.RecommendationID, "Rejected")}
                              >
                                <FaTimes style={{ marginRight: 6 }} /> Từ chối
                              </button>
                              <button 
                                className={`${styles.btnSecondary} ${styles.btnApprove}`}
                                onClick={() => handleStatusUpdate(rec.RecommendationID, "Approved", currentDiscount, currentMarketingMessage)}
                              >
                                <FaCheck style={{ marginRight: 6 }} /> Duyệt & Đăng Ký
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 3: Accuracy Evaluation */}
              {activeTab === "accuracy" && (
                <div>
                  <h3 className={styles.panelTitle}>Đối Soát Độ Chính Xác Phân Tích (MAE - Mean Absolute Error)</h3>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Ngày Đối Soát</th>
                          <th>Số Lượt Kiểm Tra</th>
                          <th>Độ Trễ Phản Hồi TB</th>
                          <th>Công Suất Thực Tế</th>
                          <th>Sai Số Tuyệt Đối TB (MAE)</th>
                          <th>Đánh Giá Chất Lượng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accuracy.length === 0 ? (
                          <tr>
                            <td colSpan={6} className={styles.emptyState}>Chưa có dữ liệu đối soát độ chính xác mô hình.</td>
                          </tr>
                        ) : (
                          accuracy.map((a, i) => {
                            const mae = a.MeanAbsoluteError;
                            let rating = "Tốt (Mô hình khớp)";
                            let ratingColor = "#4ade80";
                            if (mae > 15) {
                              rating = "Trung bình (Cần thêm dữ liệu)";
                              ratingColor = "#eab308";
                            }
                            if (mae > 30) {
                              rating = "Kém (Cần retraining gấp)";
                              ratingColor = "#f87171";
                            }
                            return (
                              <tr key={i}>
                                <td>{a.EvaluationDate}</td>
                                <td>{a.TotalSlotsAudited} khung giờ</td>
                                <td>{a.AvgLatency} ms</td>
                                <td>{a.AvgActualOccupancy.toFixed(1)}%</td>
                                <td style={{ fontWeight: 700, color: mae < 15 ? "#4ade80" : "#f87171" }}>
                                  {mae.toFixed(2)}%
                                </td>
                                <td style={{ color: ratingColor, fontWeight: 600 }}>{rating}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Logs Tab */}
              {activeTab === "logs" && (
                <div>
                  <h3 className={styles.panelTitle}>Nhật Ký Gọi Mô Hình AI Gần Nhất</h3>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Mã Log</th>
                          <th>Thời Gian</th>
                          <th>Loại Yêu Cầu</th>
                          <th>Thời Gian Xử Lý</th>
                          <th>Payload Đầu Vào</th>
                          <th>Payload Đầu Ra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className={styles.emptyState}>Không có lịch sử log mô hình.</td>
                          </tr>
                        ) : (
                          logs.map((log) => (
                            <tr key={log.LogID}>
                              <td>#{log.LogID}</td>
                              <td>{new Date(log.CreatedAt).toLocaleString()}</td>
                              <td style={{ fontWeight: 600, color: log.RequestType.includes("failed") ? "#ef4444" : "#a5b4fc" }}>
                                {log.RequestType}
                              </td>
                              <td>{log.LatencyMs} ms</td>
                              <td className={styles.jsonPayload} title={log.InputPayload}>
                                {log.InputPayload}
                              </td>
                              <td className={styles.jsonPayload} title={log.OutputPayload}>
                                {log.OutputPayload}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Right Parameters panel */}
        <section className={`${styles.glassCard} (Configuration Parameters)`}>
          <h3 className={styles.panelTitle}>
            <FaSlidersH style={{ marginRight: 8 }} /> Cấu Hình Ngưỡng & Giá
          </h3>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ngưỡng Lấp Đầy Kích Hoạt ({threshold}%)</label>
            <span className={styles.formDescription}>
              Nếu tỷ lệ lấp đầy dự báo của một khung giờ thấp hơn ngưỡng này, AI sẽ đề xuất tạo chương trình khuyến mãi.
            </span>
            <div className={styles.rangeInputWrapper}>
              <input 
                type="range" 
                min="10" 
                max="90" 
                step="5"
                className={styles.rangeSlider} 
                value={threshold} 
                onChange={(e) => setThreshold(Number(e.target.value))} 
              />
              <span className={styles.rangeValue}>{threshold}%</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Giá Sân Cơ Bản (VND/giờ)</label>
            <span className={styles.formDescription}>
              Mức giá mặc định dùng để tính toán doanh thu kỳ vọng cải thiện.
            </span>
            <input 
              type="number" 
              className={styles.numInput} 
              value={basePrice} 
              onChange={(e) => setBasePrice(Number(e.target.value))} 
            />
          </div>

          <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
            <h4 style={{ color: "#a5b4fc", margin: "0 0 10px 0", fontSize: 15 }}>Chi Chiến Lược Giảm Giá AI:</h4>
            <ul style={{ color: "#94a3b8", fontSize: 13, paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
              <li><strong>Giảm 10%:</strong> Tăng tỷ lệ lấp đầy thêm 15%</li>
              <li><strong>Giảm 20%:</strong> Tăng tỷ lệ lấp đầy thêm 30%</li>
              <li><strong>Giảm 35%:</strong> Tăng tỷ lệ lấp đầy thêm 45%</li>
              <li><strong>Giảm 50%:</strong> Tăng tỷ lệ lấp đầy thêm 55%</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
