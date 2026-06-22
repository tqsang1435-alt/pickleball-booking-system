Mô tả chi tiết các chức năng AI trong hệ thống Pickle Club
1. Tổng quan nhóm chức năng AI

Trong hệ thống Pickle Club, AI được triển khai nhằm hỗ trợ người chơi thao tác nhanh hơn, cá nhân hóa trải nghiệm và tăng khả năng kết nối cộng đồng. Thay vì chỉ dùng bộ lọc truyền thống, hệ thống bổ sung khả năng hiểu ngôn ngữ tự nhiên, phân tích nhu cầu người dùng và đưa ra gợi ý có giải thích.

Ba chức năng AI chính gồm:

AI Chatbot đặt sân và hỗ trợ người dùng
AI Recommendation System gợi ý Huấn luyện viên
AI Matchmaking gợi ý đối thủ hoặc đồng đội chơi cùng

Các chức năng này đều áp dụng hướng tiếp cận Hybrid AI: LLM/NLP được dùng để hiểu yêu cầu tự nhiên của người dùng, còn thuật toán có kiểm soát được dùng để kiểm tra dữ liệu thật, tính điểm phù hợp và gọi API nghiệp vụ tương ứng.

2. Chức năng 1: Trợ lý ảo AI Chatbot đặt sân và hỗ trợ người dùng
2.1 Mục tiêu chức năng

AI Chatbot là trợ lý ảo được tích hợp trực tiếp trên website Pickle Club, giúp người dùng hỏi đáp thông tin và thực hiện một số thao tác booking bằng ngôn ngữ tự nhiên.

Thay vì người dùng phải tự đi qua nhiều màn hình như chọn sân, chọn ngày, chọn giờ, kiểm tra slot và xác nhận đặt lịch, người dùng có thể nhập trực tiếp yêu cầu vào chatbot.

Ví dụ:

Tôi muốn đặt 1 sân cho 4 người vào chiều mai lúc 5h.

AI Chatbot sẽ phân tích câu này, hiểu ý định đặt sân, trích xuất các thông tin cần thiết, kiểm tra sân còn trống và hỗ trợ người dùng hoàn tất quy trình đặt sân.

2.2 Các nhóm tác vụ chính

AI Chatbot hỗ trợ 2 nhóm tác vụ lớn.

Nhóm 1: Hỏi đáp thông tin

Người dùng có thể hỏi các câu thông thường như:

Sân có mở cửa lúc 10h tối không?
Giá thuê sân buổi tối là bao nhiêu?
Luật chơi Pickleball cơ bản là gì?
Tôi cần chuẩn bị gì khi chơi Pickleball lần đầu?
Sân nào còn trống hôm nay?
Tôi có thể đặt sân cho 4 người không?

Với các câu hỏi về hệ thống, chatbot sẽ lấy thông tin từ database hoặc cấu hình hệ thống. Với các câu hỏi kiến thức chung như luật chơi Pickleball, chatbot có thể trả lời dựa trên dữ liệu được chuẩn bị sẵn hoặc qua LLM.

Nhóm 2: Đặt sân bằng ngôn ngữ tự nhiên

Người dùng có thể nhập câu tự nhiên như:

Đặt cho tôi một sân vào tối thứ bảy từ 7h đến 8h.

Hoặc:

Tôi muốn đặt sân cho 4 người chiều mai lúc 5h ở Đà Nẵng.

AI sẽ hiểu các thông tin chính gồm:

Ý định: đặt sân
Số lượng người chơi
Ngày muốn đặt
Giờ bắt đầu
Thời lượng
Khu vực
Loại sân nếu có
Yêu cầu đặc biệt nếu có

Sau đó hệ thống kiểm tra slot trống và trả lại kết quả phù hợp.

2.3 Vai trò của LLM trong AI Chatbot

LLM được dùng để hiểu ngôn ngữ tự nhiên của người dùng và chuyển thành dữ liệu có cấu trúc.

Ví dụ người dùng nhập:

Tôi muốn đặt 1 sân cho 4 người vào chiều mai lúc 5h.

LLM phân tích thành:

{
  "intent": "BOOK_COURT",
  "numberOfPlayers": 4,
  "date": "tomorrow",
  "time": "17:00",
  "duration": 60,
  "location": null,
  "courtType": null
}

Sau khi có dữ liệu có cấu trúc, hệ thống không để LLM tự đặt sân. NodeJS Backend sẽ kiểm tra dữ liệu thật trong database, gồm sân còn trống hay không, giờ mở cửa, trạng thái maintenance và các booking đã tồn tại.

LLM chỉ đóng vai trò phân tích ý định và trích xuất thông tin. Quyết định cuối cùng vẫn được xử lý bằng API nghiệp vụ của hệ thống.

2.4 Luồng xử lý đặt sân qua chatbot

Quy trình hoạt động gồm các bước:

Bước 1: Người dùng nhập yêu cầu

Người dùng nhập câu tự nhiên trong chatbot, ví dụ:

Tôi muốn đặt 1 sân cho 4 người vào chiều mai lúc 5h.

Bước 2: Frontend gửi message về Backend

Frontend gửi nội dung chat về NodeJS Backend qua API:

POST /api/ai/chatbot/message

Bước 3: Backend gửi nội dung sang AI Service

NodeJS Backend gọi FastAPI AI Service để phân tích ý định người dùng.

Bước 4: AI Service phân tích intent

AI Service xác định đây là yêu cầu đặt sân và trích xuất các trường cần thiết.

Bước 5: Backend kiểm tra dữ liệu thực tế

Backend kiểm tra:

Ngày giờ người dùng yêu cầu có hợp lệ không.
Sân có mở cửa trong khung giờ đó không.
Sân có đang maintenance không.
Slot đó có bị người khác đặt chưa.
Số lượng người chơi có phù hợp không.

Bước 6: Nếu thiếu thông tin, chatbot hỏi lại

Ví dụ nếu người dùng chưa nói thời lượng, chatbot có thể hỏi:

Bạn muốn đặt sân trong bao lâu? 60 phút hay 90 phút?

Bước 7: Nếu đủ thông tin, hệ thống đề xuất sân trống

Chatbot trả về danh sách sân còn trống:

Mình tìm thấy 2 sân còn trống vào chiều mai lúc 17:00:

1. Sunrise Court — 100.000đ/giờ
2. Ocean Court — 300.000đ/giờ

Bạn muốn chọn sân nào?

Bước 8: Người dùng xác nhận

Người dùng chọn sân và xác nhận đặt.

Bước 9: Backend gọi API booking

Backend gọi API đặt sân nội bộ để tạo booking.

Bước 10: Chatbot trả kết quả

Chatbot phản hồi:

Đặt sân thành công!

Sân: Sunrise Court
Thời gian: 17:00 - 18:00, ngày mai
Số người: 4
Trạng thái: Chờ thanh toán
2.5 Các intent chính của chatbot

Chatbot cần nhận diện các intent sau:

Intent	Ý nghĩa
BOOK_COURT	Đặt sân
CHECK_COURT_AVAILABILITY	Kiểm tra sân trống
ASK_PRICE	Hỏi giá sân
ASK_OPENING_HOURS	Hỏi giờ mở cửa
ASK_RULES	Hỏi luật chơi Pickleball
ASK_BOOKING_HISTORY	Hỏi lịch sử booking
CANCEL_BOOKING_HELP	Hỏi cách hủy booking
FIND_COACH	Tìm Coach
FIND_PLAYER	Tìm người chơi cùng
UNKNOWN	Không hiểu yêu cầu

Nếu intent là UNKNOWN, chatbot cần hỏi lại thay vì tự đoán.

2.6 API đề xuất
API nhận tin nhắn chatbot
POST /api/ai/chatbot/message

Request:

{
  "message": "Tôi muốn đặt 1 sân cho 4 người vào chiều mai lúc 5h",
  "conversationId": "chat_001"
}

Response:

{
  "intent": "BOOK_COURT",
  "status": "NEED_CONFIRMATION",
  "parsedData": {
    "numberOfPlayers": 4,
    "date": "2026-06-20",
    "time": "17:00",
    "duration": 60
  },
  "message": "Mình tìm thấy 2 sân còn trống vào thời gian này. Bạn muốn chọn sân nào?",
  "suggestions": [
    {
      "courtId": 1,
      "courtName": "Sunrise Court",
      "price": 100000,
      "availableTime": "17:00 - 18:00"
    }
  ]
}
API xác nhận đặt sân qua chatbot
POST /api/ai/chatbot/confirm-booking

Request:

{
  "conversationId": "chat_001",
  "courtId": 1,
  "date": "2026-06-20",
  "startTime": "17:00",
  "endTime": "18:00",
  "numberOfPlayers": 4
}

Response:

{
  "success": true,
  "bookingId": 120,
  "message": "Đặt sân thành công. Vui lòng thanh toán để hoàn tất booking."
}
2.7 Fallback và kiểm soát rủi ro

AI Chatbot không được tự ý tạo booking nếu chưa có xác nhận cuối cùng từ người dùng.

Các nguyên tắc an toàn gồm:

Nếu thiếu thông tin, chatbot phải hỏi lại.
Nếu AI không hiểu yêu cầu, chatbot chuyển sang câu hỏi gợi ý.
Nếu AI Service lỗi, hệ thống chuyển sang form đặt sân thông thường.
Nếu slot không còn trống, chatbot gợi ý slot khác.
Nếu thời gian ngoài giờ mở cửa, chatbot báo rõ và đề xuất khung giờ hợp lệ.
Mọi booking phải được tạo bởi API backend, không tạo trực tiếp từ LLM.
3. Chức năng 2: AI Recommendation System gợi ý Huấn luyện viên
3.1 Mục tiêu chức năng

Chức năng AI Recommendation System giúp người chơi tìm được Huấn luyện viên phù hợp nhất với trình độ, mục tiêu tập luyện, ngân sách, lịch rảnh và đặc điểm cá nhân.

Thay vì người dùng phải tự xem từng Coach, hệ thống sẽ phân tích nhu cầu và đề xuất danh sách Coach có mức độ phù hợp cao nhất.

Ví dụ người dùng nhập:

Tôi mới chơi, muốn Coach kiên nhẫn, dạy dễ hiểu, tập giao bóng và footwork vào cuối tuần.

Hệ thống sẽ phân tích yêu cầu này và gợi ý Coach phù hợp.

3.2 Dữ liệu đầu vào

Dữ liệu từ người dùng gồm:

Trình độ hiện tại.
Mục tiêu học.
Ngân sách tối đa.
Lịch rảnh.
Độ tuổi nếu có.
Khu vực.
Phong cách Coach mong muốn.
Yêu cầu tự nhiên nhập bằng text.

Dữ liệu từ Coach gồm:

Chuyên môn.
Trình độ có thể đào tạo.
Tiểu sử/mô tả Coach.
Giá theo giờ.
Rating.
Số học viên.
Lịch trống.
Kinh nghiệm.
Trạng thái hoạt động.
3.3 Vai trò của LLM/NLP

LLM được dùng để phân tích yêu cầu tự nhiên của người chơi.

Ví dụ:

Tôi muốn giảm cân, mới chơi, cần Coach nhẹ nhàng và có thể học vào buổi tối.

LLM phân tích thành:

{
  "level": "Beginner",
  "goals": ["weight_loss", "basic_training"],
  "teachingStyle": ["gentle", "patient"],
  "preferredTime": ["evening"],
  "priority": ["beginner_friendly"]
}

Sau đó hệ thống dùng dữ liệu này để tính điểm phù hợp cho từng Coach.

3.4 Công thức điểm phù hợp

Hệ thống sử dụng điểm AI Coach Match Score theo thang 0–100.

Công thức đề xuất:

AI Coach Match Score =
45% Structured Matching
+ 30% Semantic AI Matching
+ 15% Availability Matching
+ 10% Trust Score

Trong đó:

Structured Matching gồm:

Trình độ người chơi so với trình độ Coach hỗ trợ.
Mục tiêu học so với chuyên môn Coach.
Giá Coach so với ngân sách.
Khu vực nếu có.

Semantic AI Matching gồm:

Độ tương đồng giữa yêu cầu tự nhiên của người chơi và mô tả Coach.
Độ phù hợp giữa phong cách Coach và phong cách mong muốn.
Độ phù hợp giữa mục tiêu người chơi và nội dung Coach thường đào tạo.

Availability Matching gồm:

Lịch rảnh của người chơi.
Lịch trống của Coach.
Khung giờ ưu tiên.

Trust Score gồm:

Rating trung bình.
Số lượng học viên.
Số năm kinh nghiệm.
Mức độ hoàn thiện hồ sơ Coach.
3.5 Luồng xử lý

Bước 1: Người dùng mở trang Coach

Người dùng vào trang Coach và chọn chế độ AI chọn Coach.

Bước 2: Người dùng nhập nhu cầu

Người dùng chọn trình độ, mục tiêu, ngân sách, lịch rảnh và nhập yêu cầu tự nhiên.

Bước 3: Backend lấy danh sách Coach ứng viên

Backend chỉ lấy những Coach:

Đang active.
Có lịch trống.
Có hồ sơ hợp lệ.
Không bị khóa.
Có rating đạt ngưỡng tối thiểu nếu cần.

Bước 4: AI phân tích yêu cầu người dùng

AI Service dùng LLM/NLP để trích xuất ý định, mục tiêu và phong cách mong muốn.

Bước 5: Tính điểm từng Coach

AI Service kết hợp dữ liệu có cấu trúc và phân tích ngữ nghĩa để tính điểm.

Bước 6: Sắp xếp kết quả

Coach có điểm cao nhất được gắn nhãn Best Match.

Bước 7: Trả kết quả kèm lý do

Hệ thống trả danh sách Coach kèm:

Match Score.
Lý do phù hợp.
Lịch trống gần nhất.
Nút xem hồ sơ.
Nút đặt lịch.
3.6 Kết quả hiển thị

Ví dụ giao diện kết quả:

Lê Quốc Huy
AI Match 92/100

Vì sao phù hợp?
✓ Phù hợp với trình độ Beginner
✓ Chuyên dạy kỹ thuật cơ bản
✓ Phong cách dạy kiên nhẫn, dễ hiểu
✓ Có lịch trống cuối tuần
✓ Giá nằm trong ngân sách

[Xem hồ sơ] [Đặt lịch]
3.7 API đề xuất
POST /api/ai/coaches/recommend

Request:

{
  "level": "Beginner",
  "goals": ["weight_loss", "beginner_training"],
  "budget": 500000,
  "age": 22,
  "preferredTime": "weekend_evening",
  "styleText": "Tôi muốn Coach kiên nhẫn, dễ hiểu, giúp giảm cân và học kỹ thuật cơ bản."
}

Response:

{
  "fallback": false,
  "parsedIntent": {
    "level": "Beginner",
    "goals": ["weight_loss", "basic_training"],
    "teachingStyle": ["patient", "easy_to_understand"],
    "preferredTime": ["weekend_evening"]
  },
  "results": [
    {
      "coachId": 1,
      "coachName": "Lê Quốc Huy",
      "matchScore": 92,
      "confidence": "High",
      "reasons": [
        "Phù hợp với trình độ Beginner",
        "Chuyên dạy kỹ thuật cơ bản",
        "Phong cách dạy kiên nhẫn, dễ hiểu",
        "Có lịch trống cuối tuần"
      ],
      "availableSlots": [
        "Thứ 7, 18:00 - 19:00"
      ]
    }
  ]
}
4. Chức năng 3: AI Matchmaking gợi ý đối thủ hoặc đồng đội chơi cùng
4.1 Mục tiêu chức năng

AI Matchmaking giúp người chơi tìm được đồng đội, đối thủ hoặc nhóm chơi phù hợp. Chức năng này phù hợp với đặc thù Pickleball vì người chơi thường cần tìm người chơi cùng trình độ hoặc thiếu người để tạo “kèo” giao lưu.

Hệ thống không chỉ ghép người theo trình độ, mà còn phân tích phong cách chơi, mục tiêu tập luyện, lịch rảnh và lịch sử thi đấu để đề xuất người phù hợp.

4.2 Các loại gợi ý

Chức năng Matchmaking có thể chia thành 3 loại:

Gợi ý đồng đội

Dành cho người chơi muốn tìm partner để chơi đôi hoặc tập luyện lâu dài.

Hệ thống ưu tiên:

Trình độ tương đương.
Vai trò bổ trợ.
Lịch rảnh trùng nhau.
Mục tiêu tập luyện tương đồng.
Phong cách chơi tương thích.
Gợi ý đối thủ

Dành cho người chơi muốn giao lưu hoặc thi đấu.

Hệ thống ưu tiên:

Elo/Rating tương đương hoặc cao hơn nhẹ.
Lịch rảnh trùng nhau.
Mức độ cạnh tranh phù hợp.
Lịch sử thi đấu không quá chênh lệch.
Gợi ý nhóm chơi

Dành cho người chơi muốn tham gia nhóm đang thiếu người.

Hệ thống ưu tiên:

Nhóm chưa đủ số lượng.
Trình độ trung bình của nhóm phù hợp.
Khung giờ chơi của nhóm trùng với người dùng.
Vai trò của người dùng phù hợp với nhu cầu nhóm.
4.3 Dữ liệu đầu vào

Dữ liệu từ người chơi gồm:

Trình độ hiện tại.
Elo/Rating nếu có.
Vai trò thi đấu.
Số năm kinh nghiệm.
Lịch sử thi đấu.
Khung giờ ưa thích.
Phong cách chơi.
Mục tiêu tập luyện.
Trạng thái sẵn sàng matching.
Khu vực.

Ví dụ:

Phong cách chơi: thích đánh nhanh, tấn công sớm.
Mục tiêu: tìm đối tác lên trình nhanh, giao lưu vui vẻ.
4.4 Vai trò của LLM/NLP

LLM được dùng để phân tích hai trường văn bản tự do:

Phong cách chơi
Mục tiêu tập luyện hoặc thi đấu

Ví dụ người dùng nhập:

Tôi thích đánh nhanh thắng nhanh, muốn tìm người cùng trình để luyện phản xạ và giao lưu vui vẻ.

LLM phân tích thành:

{
  "tempo": "fast",
  "playStyle": ["aggressive", "quick_attack"],
  "goal": ["reaction_training", "friendly_match"],
  "competitiveLevel": "medium",
  "preferredPartner": ["same_level", "active", "good_reaction"]
}

Các đặc trưng này được dùng để so sánh với hồ sơ người chơi khác.

4.5 Công thức điểm phù hợp

Hệ thống sử dụng điểm AI Player Match Score theo thang 0–100.

Công thức đề xuất:

AI Player Match Score =
50% Structured Matching
+ 30% Semantic AI Matching
+ 10% Schedule Matching
+ 10% Reliability Score

Trong đó:

Structured Matching gồm:

Skill Level hoặc Elo/Rating.
Vai trò thi đấu.
Số năm kinh nghiệm.
Trạng thái matching.
Khu vực.

Semantic AI Matching gồm:

Độ tương đồng phong cách chơi.
Độ tương thích mục tiêu tập luyện.
Mức độ cạnh tranh mong muốn.
Khả năng bổ trợ giữa hai phong cách chơi.

Schedule Matching gồm:

Độ trùng khung giờ rảnh.
Ngày thường chơi.
Khung giờ ưa thích.

Reliability Score gồm:

Mức độ hoàn thiện hồ sơ.
Tỷ lệ phản hồi lời mời.
Số lần tham gia thành công.
Đánh giá sau trận nếu có.
4.6 Luồng xử lý

Bước 1: Người dùng cập nhật hồ sơ chơi bóng

Người dùng nhập vai trò, trình độ, lịch rảnh, phong cách chơi và mục tiêu tập luyện.

Bước 2: Người dùng chọn tìm đồng đội/đối thủ

Người dùng bấm nút:

Tìm người chơi phù hợp bằng AI

Bước 3: Backend lấy danh sách ứng viên

Backend lấy những người chơi:

Đang sẵn sàng matching.
Không phải chính người dùng hiện tại.
Có hồ sơ đầy đủ.
Có lịch rảnh phù hợp.
Không bị block hoặc inactive.

Bước 4: AI phân tích phong cách và mục tiêu

AI Service phân tích phong cách chơi và mục tiêu tập luyện của người dùng.

Bước 5: Tính điểm phù hợp

Hệ thống tính điểm giữa người dùng hiện tại và từng ứng viên.

Bước 6: Trả danh sách gợi ý

Hệ thống trả về danh sách người chơi/nhóm phù hợp nhất.

Bước 7: Người dùng gửi lời mời

Người dùng có thể bấm:

Mời chơi cùng

Hệ thống tạo lời mời matching.

4.7 Kết quả hiển thị

Ví dụ:

Nguyễn Minh Anh
AI Match 89/100
Intermediate · Defensive Player
Rảnh: 20:00 - 22:00

Vì sao phù hợp?
✓ Cùng trình độ Intermediate
✓ Lịch rảnh trùng 2 tiếng
✓ Phong cách chơi tốc độ cao tương đồng
✓ Vai trò Defensive bổ trợ tốt cho All-rounder

[Xem hồ sơ] [Mời chơi cùng]
4.8 API đề xuất
POST /api/ai/players/match

Request:

{
  "playingRole": "All-rounder",
  "skillLevel": "Intermediate",
  "eloRating": 1250,
  "experienceYears": 1,
  "availableStartTime": "19:00",
  "availableEndTime": "22:00",
  "preferredTime": "evening",
  "playStyle": "Thích đánh nhanh thắng nhanh, tấn công sớm.",
  "goal": "Tìm đối tác lên trình nhanh, giao lưu vui vẻ."
}

Response:

{
  "fallback": false,
  "parsedProfile": {
    "tempo": "fast",
    "playStyle": ["aggressive", "quick_attack"],
    "goal": ["improve_fast", "friendly_match"],
    "competitiveLevel": "medium"
  },
  "results": [
    {
      "playerId": 12,
      "name": "Nguyễn Minh Anh",
      "matchScore": 89,
      "matchType": "Teammate",
      "skillLevel": "Intermediate",
      "playingRole": "Defensive",
      "availableTime": "20:00 - 22:00",
      "reasons": [
        "Cùng trình độ Intermediate",
        "Lịch rảnh trùng 2 tiếng",
        "Phong cách chơi tốc độ cao tương đồng",
        "Vai trò Defensive bổ trợ tốt cho All-rounder"
      ]
    }
  ]
}
5. Cơ chế fallback chung

Cả 3 chức năng AI đều cần fallback để đảm bảo hệ thống vẫn hoạt động khi AI lỗi, phản hồi chậm hoặc không hiểu yêu cầu.

5.1 Fallback cho AI Chatbot

Nếu chatbot không hiểu yêu cầu, hệ thống trả về câu hỏi làm rõ:

Mình chưa hiểu rõ yêu cầu của bạn. Bạn muốn đặt sân, tìm Coach hay tìm người chơi cùng?

Nếu AI Service lỗi, chatbot chuyển người dùng sang form đặt sân truyền thống.

5.2 Fallback cho Coach Recommendation

Nếu LLM lỗi, hệ thống dùng scoring cơ bản dựa trên:

Trình độ.
Chuyên môn Coach.
Giá.
Rating.
Lịch trống.
5.3 Fallback cho Matchmaking

Nếu AI lỗi, hệ thống dùng matching cơ bản dựa trên:

Skill Level.
Elo/Rating.
Lịch rảnh.
Vai trò.
Trạng thái matching.
6. Logging và cải thiện hệ thống

Hệ thống cần ghi log cho tất cả chức năng AI để theo dõi hiệu quả và cải thiện về sau.

Dữ liệu nên lưu gồm:

UserID.
FeatureType: CHATBOT, COACH_RECOMMENDATION, PLAYER_MATCHING.
Nội dung người dùng nhập.
Intent hoặc parsed result từ AI.
Kết quả được đề xuất.
Match Score nếu có.
Người dùng có click không.
Người dùng có đặt sân, đặt Coach hoặc gửi lời mời không.
Kết quả cuối cùng: thành công, hủy, bỏ qua.

Ví dụ bảng log:

AIInteractionLogs
- LogID
- UserID
- FeatureType
- UserInput
- ParsedIntent
- ResultPayload
- ActionTaken
- CreatedAt

Dữ liệu log giúp hệ thống đánh giá AI có thật sự hữu ích hay không. Ví dụ, nếu nhiều người dùng chọn Coach được AI gợi ý, chứng tỏ recommendation có hiệu quả. Nếu người dùng thường bỏ qua kết quả, hệ thống cần điều chỉnh trọng số matching.

7. Kiến trúc triển khai đề xuất

Kiến trúc tổng thể:

React Frontend
↓
NodeJS Backend
↓
FastAPI AI Service
↓
LLM / NLP / Scoring
↓
NodeJS Backend
↓
Database

Frontend không gọi trực tiếp AI Service. Tất cả request đi qua NodeJS Backend để đảm bảo kiểm soát xác thực, phân quyền, timeout, fallback và logging.

Các endpoint chính:

POST /api/ai/chatbot/message
POST /api/ai/chatbot/confirm-booking
POST /api/ai/coaches/recommend
POST /api/ai/players/match
POST /api/matching/invitations
PATCH /api/ai/logs/:id/action
8. Thứ tự triển khai đề xuất
Phase 1: AI Chatbot hỏi đáp và đặt sân

Triển khai chatbot cơ bản trước, gồm:

Nhận diện intent.
Hỏi đáp thông tin sân.
Kiểm tra sân trống.
Đặt sân bằng ngôn ngữ tự nhiên.
Xác nhận trước khi tạo booking.
Phase 2: AI Coach Recommendation

Triển khai gợi ý Coach, gồm:

Phân tích nhu cầu học.
Tính AI Coach Match Score.
Hiển thị lý do gợi ý.
Cho phép đặt Coach từ kết quả AI.
Phase 3: AI Player Matchmaking

Triển khai gợi ý người chơi, gồm:

Phân tích phong cách chơi.
Phân tích mục tiêu tập luyện.
Tính AI Player Match Score.
Gửi lời mời chơi cùng.
Phase 4: Logging và cải thiện

Triển khai log toàn bộ tương tác AI, đo hiệu quả và điều chỉnh trọng số matching.

9. Kết luận

Ba chức năng AI gồm AI Chatbot đặt sân, AI Coach Recommendation và AI Matchmaking đều có giá trị trực tiếp với người chơi.

AI Chatbot giúp người dùng thao tác nhanh hơn bằng ngôn ngữ tự nhiên. AI Coach Recommendation giúp người chơi chọn Huấn luyện viên phù hợp với trình độ, mục tiêu và lịch rảnh. AI Matchmaking giúp người chơi tìm được đồng đội, đối thủ hoặc nhóm phù hợp để tăng tính cộng đồng trong hệ thống.

Cả ba chức năng đều không để AI tự quyết định hoàn toàn. AI chỉ phân tích ngôn ngữ, hiểu nhu cầu và đưa ra gợi ý. Các quyết định nghiệp vụ như tạo booking, đặt Coach hoặc gửi lời mời vẫn được xử lý bởi backend thông qua API có kiểm soát.