"use client";

import { useEffect, useMemo, useState } from "react";
import { getCourts } from "@/services/courtApi";
import type { Court } from "@/types/court";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import styles from "./CourtsPage.module.css";

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [type, setType] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCourts() {
      try {
        setLoading(true);
        setError("");

        const data = await getCourts();

        if (mounted) {
          setCourts(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Không tải được sân.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCourts();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCourts = useMemo(() => {
    return courts.filter((court) => {
      const matchType = type === "all" || court.CourtType === type;

      const searchText = [
        court.CourtName,
        court.CourtCode,
        court.Location,
        court.Description,
        court.CourtType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = searchText.includes(keyword.toLowerCase());

      return matchType && matchKeyword;
    });
  }, [courts, keyword, type]);

  function resetFilter() {
    setKeyword("");
    setType("all");
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.badge}>Find your perfect court</span>

              <h1>
                Chọn sân phù hợp <span>đặt lịch nhanh chóng</span>
              </h1>

              <p>
                Xem danh sách sân Pickleball, kiểm tra thông tin giá thuê,
                giờ hoạt động và đặt lịch chỉ trong vài bước.
              </p>

              <div className={styles.searchBox}>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm theo tên sân, khu vực, loại sân..."
                />
                <button type="button">🔍</button>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroImage}>
                <img src="/images/courts/san1.png" alt="Pickleball court" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`container ${styles.filterPanel}`}>
        <label>
          <span>Loại sân</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="Indoor">Sân trong nhà</option>
            <option value="Outdoor">Sân ngoài trời</option>
          </select>
        </label>

        <label>
          <span>Trạng thái</span>
          <select defaultValue="Available">
            <option value="Available">Còn trống</option>
            <option value="Maintenance">Bảo trì</option>
          </select>
        </label>

        <label>
          <span>Sắp xếp</span>
          <select defaultValue="popular">
            <option value="popular">Phổ biến nhất</option>
            <option value="priceAsc">Giá thấp đến cao</option>
            <option value="priceDesc">Giá cao đến thấp</option>
          </select>
        </label>

        <button type="button" onClick={resetFilter}>
          Bộ lọc
        </button>
      </section>

      <section className={`container ${styles.content}`}>
        <div className={styles.resultHeader}>
          <div>
            <h2>Danh sách sân</h2>
            <p>
              Hiển thị <strong>{filteredCourts.length}</strong> sân phù hợp
            </p>
          </div>
        </div>

        {loading ? (
          <StateBox
            variant="loading"
            title="Đang tải sân"
            description="Đang lấy dữ liệu sân từ backend."
          />
        ) : error ? (
          <StateBox
            variant="error"
            title="Không tải được dữ liệu"
            description={error}
          />
        ) : filteredCourts.length === 0 ? (
          <StateBox
            variant="empty"
            title="Không có sân phù hợp"
            description="Bạn thử đổi bộ lọc hoặc từ khóa tìm kiếm."
          />
        ) : (
          <div className={styles.grid}>
            {filteredCourts.map((court) => (
              <article className={styles.card} key={court.CourtID}>
                <div className={styles.imageWrap}>
                  <img
                    src={court.CourtImage || "/images/courts/san1.png"}
                    alt={court.CourtName}
                  />

                  <span className={styles.status}>
                    {court.Status === "Available" ? "Còn trống" : court.Status}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <div>
                      <h3>{court.CourtName}</h3>
                      <p>📍 {court.Location}</p>
                    </div>

                    <strong>
                      {formatCurrency(court.PricePerHour)}
                      <small>/giờ</small>
                    </strong>
                  </div>

                  <p className={styles.desc}>
                    {court.Description || "Sân Pickleball tiêu chuẩn."}
                  </p>

                  <div className={styles.meta}>
                    <span>
                      {court.CourtType === "Indoor"
                        ? "Sân trong nhà"
                        : "Sân ngoài trời"}
                    </span>
                    <span>
                      {court.OpenTime} - {court.CloseTime}
                    </span>
                  </div>

                  <div className={styles.actions}>
                    <button type="button">Xem lịch & đặt sân</button>
                    <button type="button" className={styles.outline}>
                      Chi tiết
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}