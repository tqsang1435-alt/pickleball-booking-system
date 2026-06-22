"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FiMessageCircle, FiX, FiSend, FiClock, FiUser } from "react-icons/fi";
import { sendChatbotMessage, CourtSlotSuggestion, CoachSuggestion } from "@/services/chatbotApi";
import styles from "./AIChatbot.module.css";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  actionType?: string;
  suggestedSlots?: CourtSlotSuggestion[];
  suggestedCoaches?: CoachSuggestion[];
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState("");
  
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Generate conversationId on mount
  useEffect(() => {
    let id = "";
    if (typeof window !== "undefined") {
      id = localStorage.getItem("chatbot_conv_id") || "";
      if (!id) {
        id = "conv_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("chatbot_conv_id", id);
      }
    }
    setConversationId(id || "conv_default");
  }, []);

  // Initialize welcome message once on client side
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: "Xin chào! Mình là Trợ lý ảo Pickle Club. Mình có thể giúp gì cho bạn hôm nay?",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll to bottom on updates
  useEffect(() => {
    if (isOpen) {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // 2. Fetch local JWT token
      const token = typeof window !== "undefined" ? localStorage.getItem("pickleclub_token") : null;

      // 3. Call backend
      const response = await sendChatbotMessage(text.trim(), conversationId, token);
      
      // 4. Add Bot Message
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: response.message || "Không nhận được phản hồi từ AI.",
        timestamp: new Date(),
        actionType: response.actionType,
        suggestedSlots: response.suggestedSlots,
        suggestedCoaches: response.suggestedCoaches
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot API Error:", error);
      const errorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: "Xin lỗi, hiện tại hệ thống AI đang gặp sự cố. Bạn vui lòng thử lại sau.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const quickSuggestions = [
    "Kiểm tra sân trống",
    "Đặt huấn luyện viên",
    "Giá thuê sân thế nào?",
    "Luật chơi Pickleball"
  ];

  return (
    <div className={styles.chatWrapper}>
      {/* Floating Bubble Button */}
      <button 
        className={styles.chatBubble} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat with AI Assistant"
      >
        {isOpen ? <FiX size={24} color="#ffffff" /> : <FiMessageCircle size={24} color="#ffffff" />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className={styles.chatPanel}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerTitleArea}>
              <div className={styles.avatar}>🤖</div>
              <div className={styles.headerText}>
                <span className={styles.headerName}>Trợ lý AI</span>
                <span className={styles.headerStatus}>
                  <span className={styles.statusDot}></span> Đang hoạt động
                </span>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close Chat">
              <FiX size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messageArea}>
            {messages.map((msg) => (
              <div key={msg.id} className={`${styles.msg} ${msg.sender === "user" ? styles.userMsg : styles.botMsg}`}>
                <div>{msg.text}</div>

                {/* Login Required Action */}
                {msg.actionType === "LOGIN_REQUIRED" && (
                  <div style={{ marginTop: "10px", width: "100%" }}>
                    <Link 
                      href="/auth/login" 
                      style={{ 
                        display: "block", 
                        background: "#3b82f6", 
                        color: "#ffffff", 
                        padding: "8px 12px", 
                        borderRadius: "8px", 
                        fontWeight: "bold", 
                        textDecoration: "none", 
                        textAlign: "center",
                        fontSize: "12px"
                      }}
                    >
                      Đăng nhập ngay
                    </Link>
                  </div>
                )}

                {/* Court Suggestions */}
                {msg.suggestedSlots && msg.suggestedSlots.length > 0 && (
                  <div style={{ width: "100%" }}>
                    {msg.suggestedSlots.map((slot, idx) => (
                      <div key={`${slot.courtId || slot.coachId}-${idx}`} className={styles.courtCard}>
                        <div className={styles.courtCardTitle}>{slot.courtName || `HLV ${slot.coachName}`}</div>
                        <div className={styles.courtCardMeta}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <FiClock size={11} /> {slot.availableTime}
                          </span>
                          <span className={styles.courtCardPrice}>{slot.price.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <button 
                          onClick={() => {
                            if (slot.coachName) {
                              handleSendMessage(`Đặt HLV ${slot.coachName} lúc ${slot.availableTime.split(" - ")[0]}`);
                            } else {
                              handleSendMessage(`Đặt sân ${slot.courtName} lúc ${slot.availableTime.split(" - ")[0]}`);
                            }
                          }} 
                          className={styles.bookBtn}
                        >
                          Chọn slot này
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Coach Suggestions */}
                {msg.suggestedCoaches && msg.suggestedCoaches.length > 0 && (
                  <div style={{ width: "100%" }}>
                    {msg.suggestedCoaches.map((coach, idx) => (
                      <div key={`${coach.coachId}-${idx}`} className={styles.courtCard}>
                        <div className={styles.courtCardTitle} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <FiUser size={12} /> Coach {coach.name}
                        </div>
                        <div className={styles.courtCardMeta}>
                          <span>Trình độ: {coach.skillLevel}</span>
                          <span className={styles.courtCardPrice}>{coach.hourlyRate.toLocaleString("vi-VN")}đ/h</span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Chuyên môn: {coach.specialization}
                        </div>
                        <button 
                          onClick={() => handleSendMessage(`Đặt HLV ${coach.name}`)} 
                          className={styles.bookBtn}
                        >
                          Chọn HLV này
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Booking Confirm Actions */}
                {(msg.actionType === "CONFIRM_COURT_BOOKING" || 
                  msg.actionType === "CONFIRM_COACH_BOOKING" ||
                  msg.actionType === "CONFIRM_CANCEL_COURT_BOOKING" ||
                  msg.actionType === "CONFIRM_CANCEL_COACH_BOOKING" ||
                  msg.actionType === "CONFIRM_RESCHEDULE_COURT_BOOKING" ||
                  msg.actionType === "CONFIRM_RESCHEDULE_COACH_BOOKING") && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", width: "100%" }}>
                    <button 
                      onClick={() => handleSendMessage("Xác nhận")} 
                      style={{ 
                        flex: 1, 
                        background: "#22c55e", 
                        color: "#ffffff", 
                        border: "none", 
                        padding: "8px", 
                        borderRadius: "6px", 
                        fontWeight: "bold", 
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Xác nhận
                    </button>
                    <button 
                      onClick={() => handleSendMessage("Hủy")} 
                      style={{ 
                        flex: 1, 
                        background: "#ef4444", 
                        color: "#ffffff", 
                        border: "none", 
                        padding: "8px", 
                        borderRadius: "6px", 
                        fontWeight: "bold", 
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Hủy bỏ
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Loader */}
            {isTyping && (
              <div className={styles.typingLoader}>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
              </div>
            )}
            
            <div ref={messageEndRef} />
          </div>

          {/* Quick suggestions chips */}
          <div className={styles.suggestionContainer}>
            {quickSuggestions.map((text, idx) => (
              <button 
                key={idx} 
                className={styles.suggestionChip}
                onClick={() => handleSendMessage(text)}
                disabled={isTyping}
              >
                {text}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form className={styles.inputArea} onSubmit={handleFormSubmit}>
            <input
              type="text"
              placeholder="Hỏi AI Trợ lý..."
              className={styles.input}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className={styles.sendBtn}
              disabled={!inputText.trim() || isTyping}
              aria-label="Send Message"
            >
              <FiSend size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
