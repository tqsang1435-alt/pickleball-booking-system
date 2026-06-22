"use client";

import React, { useState, useEffect, useRef } from "react";

interface CustomTimePickerProps {
  value: string; // "HH:mm" 24-hour format
  onChange: (value: string) => void;
  required?: boolean;
}

export default function CustomTimePicker({ value, onChange, required }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse initial 24h value to 12h states
  const parse24h = (val24: string) => {
    if (!val24) return { hour: "08", minute: "00", period: "AM" as const };
    const [hStr, mStr] = val24.split(":");
    const h = parseInt(hStr || "8", 10);
    const m = parseInt(mStr || "0", 10);
    
    const period = h >= 12 ? ("PM" as const) : ("AM" as const);
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    
    return {
      hour: String(h12).padStart(2, "0"),
      minute: String(m).padStart(2, "0"),
      period
    };
  };

  const { hour, minute, period } = parse24h(value);

  // Format 12h states back to 24h string
  const formatTo24h = (h12: string, min: string, pmAm: "AM" | "PM") => {
    let h = parseInt(h12, 10);
    if (pmAm === "PM" && h !== 12) h += 12;
    if (pmAm === "AM" && h === 12) h = 0;
    
    const hStr = String(h).padStart(2, "0");
    const mStr = String(min).padStart(2, "0");
    return `${hStr}:${mStr}`;
  };

  const handleSelectHour = (h: string) => {
    const newVal = formatTo24h(h, minute, period);
    onChange(newVal);
  };

  const handleSelectMinute = (m: string) => {
    const newVal = formatTo24h(hour, m, period);
    onChange(newVal);
  };

  const handleSelectPeriod = (p: "AM" | "PM") => {
    const newVal = formatTo24h(hour, minute, p);
    onChange(newVal);
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  
  // We list minutes at 5-minute intervals for easier selection, but allow any value
  const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  // Display label for input
  const displayLabel = `${hour}:${minute} ${period}`;

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Time Picker Display Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "0.625rem 0.75rem",
          fontSize: "14px",
          border: isOpen ? "1px solid #22c55e" : "1px solid #cbd5e1",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          color: value ? "#0f172a" : "#64748b",
          textAlign: "left",
          cursor: "pointer",
          outline: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: isOpen ? "0 0 0 2px rgba(34, 197, 94, 0.1)" : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <span>{value ? displayLabel : "--:-- --"}</span>
        <span style={{ fontSize: "16px", color: "#64748b" }}>🕒</span>
      </button>

      {/* Popover Columns Picker */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 1000,
            display: "flex",
            gap: "8px",
            padding: "10px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
            width: "240px",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Style snippet for custom fade-in and hiding scrollbars */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .time-column::-webkit-scrollbar {
              display: none;
            }
            .time-column {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          {/* Hour Column */}
          <div
            className="time-column"
            style={{
              flex: 1,
              height: "180px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textAlign: "center", marginBottom: "4px" }}>GIỜ</div>
            {hoursList.map((h) => {
              const isSelected = h === hour;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleSelectHour(h)}
                  style={{
                    padding: "6px 0",
                    fontSize: "13px",
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? "#ffffff" : "#334155",
                    backgroundColor: isSelected ? "#22c55e" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {h}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ width: "1px", backgroundColor: "#f1f5f9", height: "160px", marginTop: "20px" }} />

          {/* Minute Column */}
          <div
            className="time-column"
            style={{
              flex: 1,
              height: "180px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textAlign: "center", marginBottom: "4px" }}>PHÚT</div>
            {minutesList.map((m) => {
              const isSelected = m === minute;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMinute(m)}
                  style={{
                    padding: "6px 0",
                    fontSize: "13px",
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? "#ffffff" : "#334155",
                    backgroundColor: isSelected ? "#22c55e" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ width: "1px", backgroundColor: "#f1f5f9", height: "160px", marginTop: "20px" }} />

          {/* AM/PM Column */}
          <div
            className="time-column"
            style={{
              flex: 1,
              height: "180px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textAlign: "center", marginBottom: "4px" }}>BUỔI</div>
            {(["AM", "PM"] as const).map((p) => {
              const isSelected = p === period;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectPeriod(p)}
                  style={{
                    padding: "8px 0",
                    fontSize: "13px",
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? "#ffffff" : "#334155",
                    backgroundColor: isSelected ? "#22c55e" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
