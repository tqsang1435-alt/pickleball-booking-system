from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class IntentEnum(str, Enum):
    # Core
    GREETING = "GREETING"
    HELP = "HELP"
    UNKNOWN = "UNKNOWN"

    # Court flow
    BOOK_COURT = "BOOK_COURT"
    CHECK_COURT_AVAILABILITY = "CHECK_COURT_AVAILABILITY"
    CONFIRM_BOOKING = "CONFIRM_BOOKING"
    CONFIRM_COURT_BOOKING = "CONFIRM_COURT_BOOKING"
    REJECT_SUGGESTION = "REJECT_SUGGESTION"
    UPDATE_BOOKING_DRAFT = "UPDATE_BOOKING_DRAFT"
    ASK_PRICE = "ASK_PRICE"
    ASK_OPENING_HOURS = "ASK_OPENING_HOURS"
    ASK_COURT_INFO = "ASK_COURT_INFO"
    ASK_COURT_LIST = "ASK_COURT_LIST"
    ASK_COURT_RECOMMENDATION = "ASK_COURT_RECOMMENDATION"
    ASK_CHEAPEST_SLOT = "ASK_CHEAPEST_SLOT"
    ASK_NEAREST_AVAILABLE_SLOT = "ASK_NEAREST_AVAILABLE_SLOT"
    ASK_RULES = "ASK_RULES"
    ASK_BOOKING_HISTORY = "ASK_BOOKING_HISTORY"
    ASK_UPCOMING_BOOKINGS = "ASK_UPCOMING_BOOKINGS"
    ASK_BOOKING_STATUS = "ASK_BOOKING_STATUS"
    CANCEL_BOOKING_HELP = "CANCEL_BOOKING_HELP"
    CONFIRM_CANCEL_BOOKING = "CONFIRM_CANCEL_BOOKING"
    RESCHEDULE_BOOKING = "RESCHEDULE_BOOKING"

    # Coach flow
    FIND_COACH = "FIND_COACH"
    CHECK_COACH_AVAILABILITY = "CHECK_COACH_AVAILABILITY"
    BOOK_COACH = "BOOK_COACH"
    CONFIRM_COACH_BOOKING = "CONFIRM_COACH_BOOKING"
    CANCEL_COACH_BOOKING_HELP = "CANCEL_COACH_BOOKING_HELP"
    CONFIRM_CANCEL_COACH_BOOKING = "CONFIRM_CANCEL_COACH_BOOKING"
    RESCHEDULE_COACH_BOOKING = "RESCHEDULE_COACH_BOOKING"
    ASK_COACH_PRICE = "ASK_COACH_PRICE"
    ASK_COACH_INFO = "ASK_COACH_INFO"
    ASK_COACH_LIST = "ASK_COACH_LIST"
    ASK_COACH_RECOMMENDATION = "ASK_COACH_RECOMMENDATION"
    ASK_COACH_BOOKING_HISTORY = "ASK_COACH_BOOKING_HISTORY"
    ASK_UPCOMING_COACH_BOOKINGS = "ASK_UPCOMING_COACH_BOOKINGS"

    # Other/Shared
    ASK_PAYMENT = "ASK_PAYMENT"
    ASK_PROMOTION = "ASK_PROMOTION"
    ASK_POLICY = "ASK_POLICY"
    FIND_PLAYER = "FIND_PLAYER"
    FIND_OPPONENT_PAIR = "FIND_OPPONENT_PAIR"
    CONTACT_SUPPORT = "CONTACT_SUPPORT"
    ASK_ACCOUNT = "ASK_ACCOUNT"
    ASK_NOTIFICATION = "ASK_NOTIFICATION"
    ASK_CURRENT_COURT_STATUS = "ASK_CURRENT_COURT_STATUS"


class BookingData(BaseModel):
    dateText: Optional[str] = Field(default=None, description="Ngày thô người dùng nhập (ví dụ: 'ngày mai', 'ngày 21')")
    date: Optional[str] = Field(default=None, description="Ngày chuẩn hóa định dạng YYYY-MM-DD")
    startTimeText: Optional[str] = Field(default=None, description="Giờ bắt đầu thô người dùng nhập (ví dụ: '7h tối', '15h')")
    startTime: Optional[str] = Field(default=None, description="Giờ bắt đầu chuẩn hóa định dạng HH:MM")
    endTimeText: Optional[str] = Field(default=None, description="Giờ kết thúc thô")
    endTime: Optional[str] = Field(default=None, description="Giờ kết thúc chuẩn hóa định dạng HH:MM")
    durationMinutes: Optional[int] = Field(default=60, description="Thời lượng tính bằng phút (mặc định 60)")
    
    courtNameRaw: Optional[str] = Field(default=None, description="Tên sân thô (ví dụ: 'champion', 'sunrise')")
    coachNameRaw: Optional[str] = Field(default=None, description="Tên coach thô (ví dụ: 'coach Nam', 'Mai')")
    coachId: Optional[int] = Field(default=None, description="ID coach nếu trích xuất trực tiếp (mặc định null)")
    
    numberOfPeople: Optional[int] = Field(default=None, description="Số lượng người chơi hoặc học viên")
    studentCount: Optional[int] = Field(default=None, description="Số học viên học cùng coach")
    
    skillLevel: Optional[str] = Field(default=None, description="Trình độ người học (ví dụ: 'beginner', 'intermediate')")
    learningGoal: Optional[str] = Field(default=None, description="Mục tiêu học (ví dụ: 'giao bóng', 'học đánh cơ bản')")
    budget: Optional[float] = Field(default=None, description="Ngân sách người dùng nói")
    pricePreference: Optional[str] = Field(default=None, description="Sở thích về giá (ví dụ: 'rẻ nhất')")
    
    needCourtTogether: Optional[bool] = Field(default=None, description="True nếu lịch học cần kiểm tra cả sân trống")
    coachSpecialty: Optional[str] = Field(default=None, description="Chuyên môn coach mong muốn")
    coachGenderPreference: Optional[str] = Field(default=None, description="Giới tính coach mong muốn")
    coachRatingPreference: Optional[float] = Field(default=None, description="Đánh giá coach mong muốn")
    
    originalMessage: Optional[str] = Field(default=None, description="Tin nhắn gốc từ người dùng")


class ChatbotIntentResponse(BaseModel):
    intent: IntentEnum = Field(description="Intent dự đoán từ câu người dùng nhập")
    parsedData: BookingData = Field(description="Dữ liệu trích xuất được")
    confidence: float = Field(description="Độ tự tin của AI từ 0.0 đến 1.0")
    missingFields: List[str] = Field(description="Danh sách các trường còn thiếu")
    needDatabaseCheck: bool = Field(description="Cần kiểm tra cơ sở dữ liệu thật hay không")
    canAnswerDirectly: bool = Field(description="Có thể trả lời trực tiếp mà không cần check DB")
    replyHint: Optional[str] = Field(description="Gợi ý câu trả lời nếu canAnswerDirectly là true")

