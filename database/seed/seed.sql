-- Seed Data
USE PCS_System_3;
GO

-- =========================
-- 1. ROLES
-- =========================
INSERT INTO Roles (RoleName, Description, Status)
VALUES
('Guest', N'Người dùng chưa đăng nhập', 'Active'),
('Player', N'Người chơi đặt sân, đặt Coach và tìm người chơi', 'Active'),
('Coach', N'Huấn luyện viên Pickleball', 'Active'),
('Staff', N'Nhân viên sân', 'Active'),
('Admin', N'Quản trị hệ thống', 'Active');
GO

-- =========================
-- 2. PERMISSIONS
-- =========================
INSERT INTO Permissions (PermissionCode, PermissionName, ModuleName, Description, Status)
VALUES
('VIEW_HOME', 'View Home Page', 'Guest', N'Xem trang chủ hệ thống', 'Active'),
('VIEW_COURT_LIST', 'View Court List', 'Court', N'Xem danh sách sân Pickleball', 'Active'),
('VIEW_COURT_DETAIL', 'View Court Details', 'Court', N'Xem thông tin chi tiết sân', 'Active'),
('SEARCH_COURT', 'Search Courts', 'Court', N'Tìm kiếm sân theo ngày và giờ', 'Active'),
('VIEW_COACH_PROFILE', 'View Coach Profiles', 'Coach', N'Xem hồ sơ Coach công khai', 'Active'),
('VIEW_PRICING', 'View Pricing Information', 'Pricing', N'Xem giá thuê sân và giá Coach', 'Active'),
('REGISTER_ACCOUNT', 'Register Account', 'Auth', N'Đăng ký tài khoản mới', 'Active'),

('LOGIN', 'Login', 'Auth', N'Đăng nhập hệ thống', 'Active'),
('LOGOUT', 'Logout', 'Auth', N'Đăng xuất hệ thống', 'Active'),
('UPDATE_PROFILE', 'Update Profile', 'User', N'Cập nhật hồ sơ cá nhân', 'Active'),

('BOOK_COURT', 'Book Court', 'Booking', N'Đặt sân Pickleball', 'Active'),
('BOOK_COACH', 'Book Coach', 'Booking', N'Đặt Coach', 'Active'),
('BOOK_COMBO', 'Book Combo Court + Coach', 'Booking', N'Đặt combo sân và Coach', 'Active'),
('MAKE_PAYMENT', 'Make Online Payment', 'Payment', N'Thanh toán online', 'Active'),
('CANCEL_BOOKING', 'Cancel Booking', 'Booking', N'Hủy booking', 'Active'),
('REQUEST_REFUND', 'Request Refund', 'Refund', N'Yêu cầu hoàn tiền', 'Active'),
('VIEW_HISTORY', 'View Booking & Payment History', 'Booking', N'Xem lịch sử booking và thanh toán', 'Active'),
('CHECKIN', 'Check-in at Court', 'Booking', N'Check-in tại sân', 'Active'),
('RECEIVE_NOTIFICATION', 'Receive Notifications', 'Notification', N'Nhận thông báo hệ thống', 'Active'),
('REVIEW', 'Review Court / Coach', 'Review', N'Đánh giá sân hoặc Coach', 'Active'),

('VIEW_AI_COACH', 'View AI Coach Recommendation', 'AI', N'Xem AI gợi ý Coach', 'Active'),
('VIEW_AI_SCHEDULE', 'View AI Suggested Schedule', 'AI', N'Xem AI gợi ý lịch học', 'Active'),
('VIEW_WORKOUT_ROADMAP', 'View Workout Roadmap', 'AI', N'Xem lộ trình tập luyện', 'Active'),
('UPDATE_PLAYING_INFO', 'Update Playing Information', 'Player', N'Cập nhật vị trí chơi, kinh nghiệm và trình độ', 'Active'),
('FIND_PLAYER', 'Find Suitable Players', 'Matching', N'Tìm người chơi phù hợp', 'Active'),
('SEND_INVITATION', 'Send Play Invitation', 'Matching', N'Gửi lời mời chơi cùng', 'Active'),
('RESPOND_INVITATION', 'Respond to Play Invitation', 'Matching', N'Chấp nhận hoặc từ chối lời mời', 'Active'),
('VIEW_AI_MATCHING', 'View AI Player Matching Suggestion', 'AI', N'Xem AI gợi ý người chơi hoặc nhóm', 'Active'),

('CREATE_GROUP', 'Create Playing Group', 'Group', N'Tạo nhóm chơi Pickleball', 'Active'),
('JOIN_GROUP', 'Join Playing Group', 'Group', N'Tham gia nhóm chơi', 'Active'),
('LEAVE_GROUP', 'Leave Playing Group', 'Group', N'Rời nhóm chơi', 'Active'),
('FIND_OPPONENT_GROUP', 'Find Opponent Group', 'Matching', N'Tìm nhóm đối thủ cùng trình độ', 'Active'),
('FIND_BY_EXPERIENCE', 'Find Player by Experience', 'Matching', N'Tìm người chơi cùng kinh nghiệm', 'Active'),
('BOOK_FOR_MATCHED_PLAYER', 'Book Court for Matched Players', 'Booking', N'Đặt sân sau khi ghép nhóm', 'Active'),
('FIND_COMPLEMENTARY_PLAYER', 'Find Complementary Player', 'Matching', N'Tìm người chơi có vai trò bổ trợ', 'Active'),

('UPDATE_COACH_PROFILE', 'Update Coach Profile', 'Coach', N'Cập nhật hồ sơ Coach', 'Active'),
('UPDATE_EXPERTISE', 'Update Expertise', 'Coach', N'Cập nhật chuyên môn', 'Active'),
('CONFIG_COACH_SCHEDULE', 'Configure Available Schedule', 'Coach', N'Cấu hình lịch rảnh', 'Active'),
('CONFIG_TEACHING_FEE', 'Configure Teaching Fee', 'Coach', N'Cấu hình giá dạy', 'Active'),
('VIEW_TEACHING_SCHEDULE', 'View Teaching Schedule', 'Coach', N'Xem lịch dạy', 'Active'),
('RECEIVE_BOOKING_NOTIFY', 'Receive Booking Notifications', 'Coach', N'Nhận thông báo booking', 'Active'),
('CANCEL_TEACHING_SESSION', 'Cancel Teaching Session', 'Coach', N'Hủy buổi dạy', 'Active'),
('VIEW_WORKING_INCOME', 'View Working Hours & Income', 'Coach', N'Xem giờ làm và thu nhập', 'Active'),

('CONFIRM_CHECKIN', 'Confirm Customer Check-in', 'Staff', N'Xác nhận check-in', 'Active'),
('VIEW_DAILY_BOOKING', 'View Daily Bookings', 'Staff', N'Xem booking trong ngày', 'Active'),
('HANDLE_NOSHOW', 'Handle No-show Cases', 'Staff', N'Xử lý No-show', 'Active'),
('REPORT_COURT_ISSUE', 'Report Court Issues', 'Staff', N'Báo cáo sự cố sân', 'Active'),

('MANAGE_COURT', 'Add / Update Court Information', 'Admin', N'Thêm hoặc cập nhật thông tin sân', 'Active'),
('CONFIG_COURT_PRICE_TIME', 'Configure Court Pricing & Operating Hours', 'Admin', N'Cấu hình giá sân và giờ hoạt động', 'Active'),
('CREATE_MAINTENANCE', 'Create Maintenance Schedule', 'Admin', N'Tạo lịch bảo trì sân', 'Active'),
('APPROVE_COACH', 'Approve & Update Coach', 'Admin', N'Duyệt và cập nhật Coach', 'Active'),
('MANAGE_PROMOTION', 'Create / Update Promotions', 'Admin', N'Tạo và cập nhật khuyến mãi', 'Active'),
('CONFIG_CANCEL_POLICY', 'Configure Cancellation Policy', 'Admin', N'Cấu hình chính sách hủy', 'Active'),
('VIEW_REVENUE', 'View Revenue & Coach Income', 'Admin', N'Xem doanh thu và thu nhập Coach', 'Active'),
('VIEW_ANALYTICS', 'View Booking Statistics & AI Analytics', 'Admin', N'Xem thống kê booking và phân tích AI', 'Active'),
('MANAGE_RBAC_LOG', 'Assign Roles, Lock Accounts & View Logs', 'Admin', N'Cấp quyền, khóa tài khoản và xem logs', 'Active');
GO

-- =========================
-- 3. ROLE PERMISSIONS
-- =========================
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
JOIN Permissions p ON p.PermissionCode IN (
'VIEW_HOME','VIEW_COURT_LIST','VIEW_COURT_DETAIL','SEARCH_COURT',
'VIEW_COACH_PROFILE','VIEW_PRICING','REGISTER_ACCOUNT'
)
WHERE r.RoleName = 'Guest';
GO

INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
JOIN Permissions p ON p.PermissionCode IN (
'LOGIN','LOGOUT','UPDATE_PROFILE','VIEW_COURT_LIST','VIEW_COURT_DETAIL',
'SEARCH_COURT','BOOK_COURT','BOOK_COACH','BOOK_COMBO','MAKE_PAYMENT',
'CANCEL_BOOKING','REQUEST_REFUND','VIEW_HISTORY','CHECKIN',
'RECEIVE_NOTIFICATION','REVIEW','VIEW_AI_COACH','VIEW_AI_SCHEDULE',
'VIEW_WORKOUT_ROADMAP','UPDATE_PLAYING_INFO','FIND_PLAYER',
'SEND_INVITATION','RESPOND_INVITATION','VIEW_AI_MATCHING',
'CREATE_GROUP','JOIN_GROUP','LEAVE_GROUP','FIND_OPPONENT_GROUP',
'FIND_BY_EXPERIENCE','BOOK_FOR_MATCHED_PLAYER','FIND_COMPLEMENTARY_PLAYER'
)
WHERE r.RoleName = 'Player';
GO

INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
JOIN Permissions p ON p.PermissionCode IN (
'LOGIN','LOGOUT','UPDATE_PROFILE','UPDATE_COACH_PROFILE',
'UPDATE_EXPERTISE','CONFIG_COACH_SCHEDULE','CONFIG_TEACHING_FEE',
'VIEW_TEACHING_SCHEDULE','RECEIVE_BOOKING_NOTIFY',
'CANCEL_TEACHING_SESSION','VIEW_WORKING_INCOME'
)
WHERE r.RoleName = 'Coach';
GO

INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
JOIN Permissions p ON p.PermissionCode IN (
'LOGIN','LOGOUT','CONFIRM_CHECKIN','VIEW_DAILY_BOOKING',
'HANDLE_NOSHOW','REPORT_COURT_ISSUE'
)
WHERE r.RoleName = 'Staff';
GO

INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
WHERE r.RoleName = 'Admin';
GO

-- =========================
-- 4. USERS
-- =========================
INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, Gender, DateOfBirth, Address, Status)
VALUES
(N'Nguyễn Văn Admin', 'admin@pcs.com', '0900000001', 'hashed_password', 'Male', '1990-01-01', N'Đà Nẵng', 'Active'),
(N'Trần Thị Staff', 'staff@pcs.com', '0900000002', 'hashed_password', 'Female', '1995-02-02', N'Đà Nẵng', 'Active'),
(N'Lê Văn Coach', 'coach1@pcs.com', '0900000003', 'hashed_password', 'Male', '1988-03-03', N'Đà Nẵng', 'Active'),
(N'Phạm Thị Coach', 'coach2@pcs.com', '0900000004', 'hashed_password', 'Female', '1992-04-04', N'Đà Nẵng', 'Active'),
(N'Nguyễn Văn Player', 'player1@pcs.com', '0900000005', 'hashed_password', 'Male', '2002-05-05', N'Đà Nẵng', 'Active'),
(N'Lê Thị Player', 'player2@pcs.com', '0900000006', 'hashed_password', 'Female', '2003-06-06', N'Đà Nẵng', 'Active'),
(N'Hoàng Văn Player', 'player3@pcs.com', '0900000007', 'hashed_password', 'Male', '2001-07-07', N'Đà Nẵng', 'Active');
GO

-- =========================
-- 5. USER ROLES
-- =========================
INSERT INTO UserRoles (UserID, RoleID)
SELECT u.UserID, r.RoleID
FROM Users u
JOIN Roles r ON r.RoleName = 'Admin'
WHERE u.Email = 'admin@pcs.com';

INSERT INTO UserRoles (UserID, RoleID)
SELECT u.UserID, r.RoleID
FROM Users u
JOIN Roles r ON r.RoleName = 'Staff'
WHERE u.Email = 'staff@pcs.com';

INSERT INTO UserRoles (UserID, RoleID)
SELECT u.UserID, r.RoleID
FROM Users u
JOIN Roles r ON r.RoleName = 'Coach'
WHERE u.Email IN ('coach1@pcs.com', 'coach2@pcs.com');

INSERT INTO UserRoles (UserID, RoleID)
SELECT u.UserID, r.RoleID
FROM Users u
JOIN Roles r ON r.RoleName = 'Player'
WHERE u.Email IN ('player1@pcs.com', 'player2@pcs.com', 'player3@pcs.com');
GO

-- =========================
-- 6. COURTS
-- =========================
INSERT INTO Courts (CourtCode, CourtName, CourtType, Location, Description, PricePerHour, Status, OpenTime, CloseTime)
VALUES
('C001', N'Court A', 'Indoor', N'Khu A', N'Sân trong nhà tiêu chuẩn', 120000, 'Available', '06:00', '22:00'),
('C002', N'Court B', 'Outdoor', N'Khu B', N'Sân ngoài trời', 100000, 'Available', '06:00', '22:00'),
('C003', N'Court C', 'Indoor', N'Khu C', N'Sân trong nhà cao cấp', 150000, 'Maintenance', '06:00', '22:00');
GO

-- =========================
-- 7. COACHES
-- =========================
INSERT INTO Coaches (UserID, ExperienceYears, SkillLevel, Specialization, Certifications, HourlyRate, Biography, Status)
SELECT UserID, 5, 'Advanced', N'Dạy người mới, chiến thuật đánh đôi', N'Pickleball Coach Certificate', 200000,
N'Coach chuyên dạy người mới và chiến thuật đánh đôi.', 'Approved'
FROM Users
WHERE Email = 'coach1@pcs.com';

INSERT INTO Coaches (UserID, ExperienceYears, SkillLevel, Specialization, Certifications, HourlyRate, Biography, Status)
SELECT UserID, 8, 'Professional', N'Kỹ thuật nâng cao, luyện thi đấu', N'Professional Pickleball Certificate', 300000,
N'Coach chuyên đào tạo nâng cao và thi đấu.', 'Approved'
FROM Users
WHERE Email = 'coach2@pcs.com';
GO

-- =========================
-- 8. PLAYER PROFILES
-- =========================
INSERT INTO PlayerProfiles (UserID, PlayingRole, ExperienceYears, SkillLevel, PlayStyle, Rating, MatchingStatus)
SELECT UserID, 'Attacker', 1, 'Beginner', N'Tấn công', 3.5, 'Available'
FROM Users WHERE Email = 'player1@pcs.com';

INSERT INTO PlayerProfiles (UserID, PlayingRole, ExperienceYears, SkillLevel, PlayStyle, Rating, MatchingStatus)
SELECT UserID, 'Defender', 2, 'Intermediate', N'Phòng thủ', 4.0, 'Available'
FROM Users WHERE Email = 'player2@pcs.com';

INSERT INTO PlayerProfiles (UserID, PlayingRole, ExperienceYears, SkillLevel, PlayStyle, Rating, MatchingStatus)
SELECT UserID, 'All-rounder', 3, 'Intermediate', N'Cân bằng', 4.2, 'Busy'
FROM Users WHERE Email = 'player3@pcs.com';
GO

-- =========================
-- 9. COACH SCHEDULES
-- =========================
INSERT INTO CoachSchedules (CoachID, AvailableDate, StartTime, EndTime, Status)
SELECT CoachID, '2026-06-01', '08:00', '10:00', 'Available'
FROM Coaches WHERE UserID = (SELECT UserID FROM Users WHERE Email = 'coach1@pcs.com');

INSERT INTO CoachSchedules (CoachID, AvailableDate, StartTime, EndTime, Status)
SELECT CoachID, '2026-06-01', '14:00', '16:00', 'Available'
FROM Coaches WHERE UserID = (SELECT UserID FROM Users WHERE Email = 'coach1@pcs.com');

INSERT INTO CoachSchedules (CoachID, AvailableDate, StartTime, EndTime, Status)
SELECT CoachID, '2026-06-01', '09:00', '11:00', 'Available'
FROM Coaches WHERE UserID = (SELECT UserID FROM Users WHERE Email = 'coach2@pcs.com');

INSERT INTO CoachSchedules (CoachID, AvailableDate, StartTime, EndTime, Status)
SELECT CoachID, '2026-06-02', '15:00', '17:00', 'Unavailable'
FROM Coaches WHERE UserID = (SELECT UserID FROM Users WHERE Email = 'coach2@pcs.com');
GO

-- =========================
-- 10. BOOKINGS
-- =========================
INSERT INTO Bookings (BookingCode, UserID, CourtID, CoachID, BookingType, BookingDate, StartTime, EndTime, TotalAmount, Status)
SELECT 
'BK001',
u.UserID,
c.CourtID,
NULL,
'Court',
'2026-06-01',
'08:00',
'09:00',
120000,
'Confirmed'
FROM Users u
JOIN Courts c ON c.CourtCode = 'C001'
WHERE u.Email = 'player1@pcs.com';

INSERT INTO Bookings (BookingCode, UserID, CourtID, CoachID, BookingType, BookingDate, StartTime, EndTime, TotalAmount, Status)
SELECT 
'BK002',
u.UserID,
NULL,
co.CoachID,
'Coach',
'2026-06-01',
'14:00',
'15:00',
200000,
'Confirmed'
FROM Users u
JOIN Coaches co ON co.UserID = (SELECT UserID FROM Users WHERE Email = 'coach1@pcs.com')
WHERE u.Email = 'player2@pcs.com';

INSERT INTO Bookings (BookingCode, UserID, CourtID, CoachID, BookingType, BookingDate, StartTime, EndTime, TotalAmount, Status)
SELECT 
'BK003',
u.UserID,
c.CourtID,
co.CoachID,
'Combo',
'2026-06-01',
'09:00',
'10:00',
400000,
'Pending'
FROM Users u
JOIN Courts c ON c.CourtCode = 'C002'
JOIN Coaches co ON co.UserID = (SELECT UserID FROM Users WHERE Email = 'coach2@pcs.com')
WHERE u.Email = 'player3@pcs.com';
GO

-- =========================
-- 11. PAYMENTS
-- =========================
INSERT INTO Payments (BookingID, PaymentMethod, Amount, TransactionCode, Status, PaidAt)
SELECT BookingID, 'VNPay', 120000, 'TXN001', 'Paid', GETDATE()
FROM Bookings WHERE BookingCode = 'BK001';

INSERT INTO Payments (BookingID, PaymentMethod, Amount, TransactionCode, Status, PaidAt)
SELECT BookingID, 'Momo', 200000, 'TXN002', 'Paid', GETDATE()
FROM Bookings WHERE BookingCode = 'BK002';

INSERT INTO Payments (BookingID, PaymentMethod, Amount, TransactionCode, Status, PaidAt)
SELECT BookingID, 'Banking', 400000, NULL, 'Pending', NULL
FROM Bookings WHERE BookingCode = 'BK003';
GO

-- =========================
-- 12. REFUNDS
-- =========================
INSERT INTO Refunds (PaymentID, RefundAmount, Reason, Status)
SELECT PaymentID, 60000, N'Khách hủy trước thời gian cho phép', 'Requested'
FROM Payments
WHERE TransactionCode = 'TXN001';
GO

-- =========================
-- 13. REVIEWS
-- =========================
INSERT INTO Reviews (UserID, CourtID, CoachID, Rating, Comment, Status)
SELECT u.UserID, c.CourtID, NULL, 5, N'Sân sạch, chất lượng tốt', 'Visible'
FROM Users u
JOIN Courts c ON c.CourtCode = 'C001'
WHERE u.Email = 'player1@pcs.com';

INSERT INTO Reviews (UserID, CourtID, CoachID, Rating, Comment, Status)
SELECT u.UserID, NULL, co.CoachID, 5, N'Coach hướng dẫn dễ hiểu', 'Visible'
FROM Users u
JOIN Coaches co ON co.UserID = (SELECT UserID FROM Users WHERE Email = 'coach1@pcs.com')
WHERE u.Email = 'player2@pcs.com';
GO

-- =========================
-- 14. NOTIFICATIONS
-- =========================
INSERT INTO Notifications (UserID, Title, Message, Status)
SELECT UserID, N'Booking confirmed', N'Lịch đặt sân của bạn đã được xác nhận.', 'Unread'
FROM Users WHERE Email = 'player1@pcs.com';

INSERT INTO Notifications (UserID, Title, Message, Status)
SELECT UserID, N'Coach booking confirmed', N'Lịch học với Coach đã được xác nhận.', 'Unread'
FROM Users WHERE Email = 'player2@pcs.com';

INSERT INTO Notifications (UserID, Title, Message, Status)
SELECT UserID, N'New booking', N'Bạn có một lịch dạy mới.', 'Unread'
FROM Users WHERE Email = 'coach1@pcs.com';
GO

-- =========================
-- 15. PROMOTIONS
-- =========================
INSERT INTO Promotions (PromotionCode, PromotionName, DiscountPercent, StartDate, EndDate, Status)
VALUES
('NEWPLAYER10', N'Giảm 10% cho người chơi mới', 10, '2026-06-01', '2026-06-30', 'Active'),
('COMBO15', N'Giảm 15% khi đặt combo sân và Coach', 15, '2026-06-01', '2026-07-31', 'Active');
GO

-- =========================
-- 16. MAINTENANCE SCHEDULES
-- =========================
INSERT INTO MaintenanceSchedules (CourtID, MaintenanceDate, StartTime, EndTime, Reason, Status)
SELECT CourtID, '2026-06-02', '08:00', '12:00', N'Bảo trì mặt sân', 'Scheduled'
FROM Courts
WHERE CourtCode = 'C003';
GO

-- =========================
-- 17. COURT ISSUES
-- =========================
INSERT INTO CourtIssues (CourtID, ReportedBy, IssueTitle, Description, Status)
SELECT c.CourtID, u.UserID, N'Đèn sân bị lỗi', N'Đèn khu vực cuối sân không sáng', 'Open'
FROM Courts c
JOIN Users u ON u.Email = 'staff@pcs.com'
WHERE c.CourtCode = 'C002';
GO

-- =========================
-- 18. PLAYING GROUPS
-- =========================
INSERT INTO PlayingGroups (GroupName, CreatedBy, SkillLevel, Description, Status)
SELECT N'Beginner Pickleball Team', UserID, 'Beginner', N'Nhóm dành cho người mới chơi', 'Open'
FROM Users
WHERE Email = 'player1@pcs.com';

INSERT INTO PlayingGroups (GroupName, CreatedBy, SkillLevel, Description, Status)
SELECT N'Intermediate Team', UserID, 'Intermediate', N'Nhóm trình độ trung bình', 'Open'
FROM Users
WHERE Email = 'player2@pcs.com';
GO

-- =========================
-- 19. GROUP MEMBERS
-- =========================
INSERT INTO GroupMembers (GroupID, UserID, RoleInGroup, Status)
SELECT g.GroupID, u.UserID, 'Leader', 'Active'
FROM PlayingGroups g
JOIN Users u ON u.Email = 'player1@pcs.com'
WHERE g.GroupName = N'Beginner Pickleball Team';

INSERT INTO GroupMembers (GroupID, UserID, RoleInGroup, Status)
SELECT g.GroupID, u.UserID, 'Member', 'Active'
FROM PlayingGroups g
JOIN Users u ON u.Email = 'player2@pcs.com'
WHERE g.GroupName = N'Beginner Pickleball Team';

INSERT INTO GroupMembers (GroupID, UserID, RoleInGroup, Status)
SELECT g.GroupID, u.UserID, 'Leader', 'Active'
FROM PlayingGroups g
JOIN Users u ON u.Email = 'player2@pcs.com'
WHERE g.GroupName = N'Intermediate Team';

INSERT INTO GroupMembers (GroupID, UserID, RoleInGroup, Status)
SELECT g.GroupID, u.UserID, 'Member', 'Active'
FROM PlayingGroups g
JOIN Users u ON u.Email = 'player3@pcs.com'
WHERE g.GroupName = N'Intermediate Team';
GO

-- =========================
-- 20. PLAY INVITATIONS
-- =========================
INSERT INTO PlayInvitations (SenderID, ReceiverID, GroupID, Message, Status)
SELECT sender.UserID, receiver.UserID, g.GroupID, N'Bạn có muốn chơi cùng nhóm mình không?', 'Pending'
FROM Users sender
JOIN Users receiver ON receiver.Email = 'player2@pcs.com'
JOIN PlayingGroups g ON g.GroupName = N'Beginner Pickleball Team'
WHERE sender.Email = 'player1@pcs.com';

INSERT INTO PlayInvitations (SenderID, ReceiverID, GroupID, Message, Status)
SELECT sender.UserID, receiver.UserID, g.GroupID, N'Tham gia nhóm đánh đôi nhé?', 'Accepted'
FROM Users sender
JOIN Users receiver ON receiver.Email = 'player3@pcs.com'
JOIN PlayingGroups g ON g.GroupName = N'Intermediate Team'
WHERE sender.Email = 'player2@pcs.com';
GO

-- =========================
-- 21. MATCHING SUGGESTIONS
-- =========================
INSERT INTO MatchingSuggestions (UserID, SuggestedUserID, SuggestedGroupID, MatchingScore, Reason, Status)
SELECT u1.UserID, u2.UserID, NULL, 87.50, N'Người chơi có vai trò bổ trợ: Attacker kết hợp Defender', 'Suggested'
FROM Users u1
JOIN Users u2 ON u2.Email = 'player2@pcs.com'
WHERE u1.Email = 'player1@pcs.com';

INSERT INTO MatchingSuggestions (UserID, SuggestedUserID, SuggestedGroupID, MatchingScore, Reason, Status)
SELECT u.UserID, NULL, g.GroupID, 80.00, N'Nhóm có cùng trình độ Beginner', 'Suggested'
FROM Users u
JOIN PlayingGroups g ON g.GroupName = N'Beginner Pickleball Team'
WHERE u.Email = 'player1@pcs.com';
GO

-- =========================
-- 22. AI RECOMMENDATIONS
-- =========================
INSERT INTO AIRecommendations (UserID, RecommendationType, Content, Status)
SELECT UserID, 'Coach', N'AI gợi ý Coach Lê Văn Coach vì phù hợp với người mới chơi.', 'Active'
FROM Users WHERE Email = 'player1@pcs.com';

INSERT INTO AIRecommendations (UserID, RecommendationType, Content, Status)
SELECT UserID, 'Schedule', N'AI gợi ý lịch học vào buổi sáng từ 08:00 đến 10:00.', 'Active'
FROM Users WHERE Email = 'player1@pcs.com';

INSERT INTO AIRecommendations (UserID, RecommendationType, Content, Status)
SELECT UserID, 'WorkoutRoadmap', N'Tuần 1: học luật cơ bản. Tuần 2: luyện giao bóng. Tuần 3: luyện đánh đôi.', 'Active'
FROM Users WHERE Email = 'player1@pcs.com';

INSERT INTO AIRecommendations (UserID, RecommendationType, Content, Status)
SELECT UserID, 'PlayerMatching', N'AI gợi ý ghép với Lê Thị Player vì vai trò chơi bổ trợ.', 'Active'
FROM Users WHERE Email = 'player1@pcs.com';
GO

-- =========================
-- 23. AUDIT LOGS
-- =========================
INSERT INTO AuditLogs (UserID, ActionName, TableName, Description)
SELECT UserID, 'CREATE_COURT', 'Courts', N'Admin thêm sân Court A, Court B, Court C'
FROM Users WHERE Email = 'admin@pcs.com';

INSERT INTO AuditLogs (UserID, ActionName, TableName, Description)
SELECT UserID, 'ASSIGN_ROLE', 'UserRoles', N'Admin phân quyền mặc định cho user'
FROM Users WHERE Email = 'admin@pcs.com';

INSERT INTO AuditLogs (UserID, ActionName, TableName, Description)
SELECT UserID, 'REPORT_ISSUE', 'CourtIssues', N'Staff báo cáo sự cố sân'
FROM Users WHERE Email = 'staff@pcs.com';
GO