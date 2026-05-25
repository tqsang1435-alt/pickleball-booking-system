-- =========================================
-- SEED DATA PCS SYSTEM
-- Password test: 123456
-- Hash bcrypt below dùng cho password 123456
-- =========================================

DECLARE @PasswordHash NVARCHAR(255) =
'$2a$10$7EqJtq98hPqEX7fNZaFWoOhiu5atfsKQ6Xu/s09e1WPn6B4S9j4cC';

-- =========================================
-- ROLES
-- =========================================
INSERT INTO Roles (RoleName, Description, Status)
VALUES
('Admin', N'Quản trị viên hệ thống PCS', 'Active'),
('Staff', N'Nhân viên vận hành sân Pickleball', 'Active'),
('Coach', N'Huấn luyện viên Pickleball', 'Active'),
('Player', N'Người chơi Pickleball', 'Active'),
('Customer', N'Khách hàng đặt sân và đặt Coach', 'Active');

-- =========================================
-- PERMISSIONS
-- =========================================
INSERT INTO Permissions
(PermissionCode, PermissionName, ModuleName, Description)
VALUES
('USER_VIEW', N'Xem người dùng', 'Users', N'Xem danh sách và thông tin người dùng'),
('USER_CREATE', N'Tạo người dùng', 'Users', N'Tạo tài khoản người dùng'),
('USER_UPDATE', N'Cập nhật người dùng', 'Users', N'Cập nhật thông tin người dùng'),
('USER_DELETE', N'Xóa người dùng', 'Users', N'Khóa hoặc vô hiệu hóa người dùng'),

('COURT_VIEW', N'Xem sân', 'Courts', N'Xem danh sách và chi tiết sân'),
('COURT_MANAGE', N'Quản lý sân', 'Courts', N'Thêm, sửa, bảo trì hoặc khóa sân'),

('BOOKING_VIEW', N'Xem lịch đặt', 'Bookings', N'Xem lịch đặt sân'),
('BOOKING_CREATE', N'Tạo lịch đặt', 'Bookings', N'Tạo booking sân hoặc Coach'),
('BOOKING_MANAGE', N'Quản lý lịch đặt', 'Bookings', N'Xác nhận, hủy hoặc cập nhật booking'),

('COACH_VIEW', N'Xem Coach', 'Coaches', N'Xem hồ sơ huấn luyện viên'),
('COACH_MANAGE', N'Quản lý Coach', 'Coaches', N'Thêm, sửa hoặc khóa Coach'),

('PAYMENT_VIEW', N'Xem thanh toán', 'Payments', N'Xem thông tin thanh toán'),
('PAYMENT_MANAGE', N'Quản lý thanh toán', 'Payments', N'Xác nhận, xử lý hoặc hoàn tiền');

-- =========================================
-- ROLE PERMISSIONS
-- =========================================

-- Admin có tất cả quyền
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
WHERE r.RoleName = 'Admin';

-- Staff
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
JOIN Permissions p ON p.PermissionCode IN (
    'COURT_VIEW',
    'COURT_MANAGE',
    'BOOKING_VIEW',
    'BOOKING_MANAGE',
    'COACH_VIEW',
    'PAYMENT_VIEW'
)
WHERE r.RoleName = 'Staff';

-- Coach
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
JOIN Permissions p ON p.PermissionCode IN (
    'COACH_VIEW',
    'BOOKING_VIEW'
)
WHERE r.RoleName = 'Coach';

-- Player
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
JOIN Permissions p ON p.PermissionCode IN (
    'COURT_VIEW',
    'BOOKING_CREATE',
    'COACH_VIEW'
)
WHERE r.RoleName = 'Player';

-- Customer
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
JOIN Permissions p ON p.PermissionCode IN (
    'COURT_VIEW',
    'BOOKING_CREATE',
    'COACH_VIEW',
    'PAYMENT_VIEW'
)
WHERE r.RoleName = 'Customer';

-- =========================================
-- USERS
-- Password = 123456
-- Email phải là @gmail.com
-- =========================================
INSERT INTO Users
(
    FullName,
    Email,
    PhoneNumber,
    PasswordHash,
    AvatarURL,
    Gender,
    DateOfBirth,
    Address,
    Status
)
VALUES
(
    N'Lê Thị Vân Anh',
    'levanthivananh.pcs@gmail.com',
    '0901000001',
    @PasswordHash,
    '/avatars/le-thi-van-anh.png',
    'Female',
    '2004-09-14',
    N'Quận 7, TP. Hồ Chí Minh',
    'Active'
),
(
    N'Nguyễn Minh Khang',
    'nguyenminhkhang.pcs@gmail.com',
    '0902000002',
    @PasswordHash,
    '/avatars/nguyen-minh-khang.png',
    'Male',
    '1998-05-20',
    N'Quận Bình Thạnh, TP. Hồ Chí Minh',
    'Active'
),
(
    N'Trần Quốc Huy',
    'tranquochuy.coach@gmail.com',
    '0903000003',
    @PasswordHash,
    '/avatars/tran-quoc-huy.png',
    'Male',
    '1995-01-15',
    N'Thành phố Thủ Đức, TP. Hồ Chí Minh',
    'Active'
),
(
    N'Phạm Ngọc Mai',
    'phamngocmai.player@gmail.com',
    '0904000004',
    @PasswordHash,
    '/avatars/pham-ngoc-mai.png',
    'Female',
    '2001-08-10',
    N'Quận Tân Bình, TP. Hồ Chí Minh',
    'Active'
),
(
    N'Nguyễn Hoàng Nam',
    'nguyenhoangnam.customer@gmail.com',
    '0905000005',
    @PasswordHash,
    '/avatars/nguyen-hoang-nam.png',
    'Male',
    '2002-03-12',
    N'Quận Gò Vấp, TP. Hồ Chí Minh',
    'Active'
);

-- =========================================
-- USER ROLES
-- =========================================
INSERT INTO UserRoles (UserID, RoleID)
SELECT u.UserID, r.RoleID
FROM Users u
JOIN Roles r ON
    (u.Email = 'levanthivananh.pcs@gmail.com' AND r.RoleName = 'Admin')
 OR (u.Email = 'nguyenminhkhang.pcs@gmail.com' AND r.RoleName = 'Staff')
 OR (u.Email = 'tranquochuy.coach@gmail.com' AND r.RoleName = 'Coach')
 OR (u.Email = 'phamngocmai.player@gmail.com' AND r.RoleName = 'Player')
 OR (u.Email = 'nguyenhoangnam.customer@gmail.com' AND r.RoleName = 'Customer');

-- =========================================
-- COURTS
-- =========================================
INSERT INTO Courts
(
    CourtCode,
    CourtName,
    CourtType,
    Location,
    Description,
    PricePerHour,
    CourtImage,
    Status,
    OpenTime,
    CloseTime
)
VALUES
(
    'PCS-C01',
    N'Sân Indoor Pearl 01',
    'Indoor',
    N'PCS Pickleball Center - Quận 7, TP. Hồ Chí Minh',
    N'Sân trong nhà cao cấp, mặt sân tiêu chuẩn, ánh sáng LED chống chói, phù hợp thi đấu và luyện tập.',
    250000,
    '/courts/indoor-pearl-01.jpg',
    'Available',
    '06:00',
    '22:00'
),
(
    'PCS-C02',
    N'Sân Outdoor Sunset 02',
    'Outdoor',
    N'PCS Pickleball Center - Thành phố Thủ Đức, TP. Hồ Chí Minh',
    N'Sân ngoài trời thoáng mát, phù hợp chơi buổi chiều, cuối tuần và nhóm bạn.',
    180000,
    '/courts/outdoor-sunset-02.jpg',
    'Available',
    '06:00',
    '22:00'
),
(
    'PCS-C03',
    N'Sân Indoor Ruby 03',
    'Indoor',
    N'PCS Pickleball Center - Quận Bình Thạnh, TP. Hồ Chí Minh',
    N'Sân trong nhà có khu vực chờ, tủ đồ cá nhân và hệ thống làm mát.',
    220000,
    '/courts/indoor-ruby-03.jpg',
    'Available',
    '07:00',
    '23:00'
),
(
    'PCS-C04',
    N'Sân Outdoor Green 04',
    'Outdoor',
    N'PCS Pickleball Center - Quận Tân Bình, TP. Hồ Chí Minh',
    N'Sân ngoài trời giá tốt, phù hợp người mới chơi và nhóm luyện tập cơ bản.',
    160000,
    '/courts/outdoor-green-04.jpg',
    'Available',
    '06:00',
    '21:30'
);

-- =========================================
-- COACHES
-- =========================================
INSERT INTO Coaches
(
    UserID,
    ExperienceYears,
    SkillLevel,
    Specialization,
    Certifications,
    HourlyRate,
    Biography,
    Status
)
SELECT
    u.UserID,
    6,
    'Professional',
    N'Chiến thuật đánh đôi, kiểm soát bóng và luyện phản xạ',
    N'IPTPA Level 2, Pickleball Coaching Certificate',
    500000,
    N'Coach Trần Quốc Huy có hơn 6 năm kinh nghiệm thi đấu và huấn luyện Pickleball, phù hợp cho người mới bắt đầu đến trình độ nâng cao.',
    'Approved'
FROM Users u
WHERE u.Email = 'tranquochuy.coach@gmail.com';

-- =========================================
-- PLAYER PROFILES
-- =========================================
INSERT INTO PlayerProfiles
(
    UserID,
    PlayingRole,
    ExperienceYears,
    SkillLevel,
    PlayStyle,
    Rating,
    MatchingStatus
)
SELECT
    u.UserID,
    'All-rounder',
    3,
    'Intermediate',
    N'Lối chơi cân bằng, linh hoạt giữa phòng thủ và tấn công',
    4.20,
    'Available'
FROM Users u
WHERE u.Email = 'phamngocmai.player@gmail.com';

-- =========================================
-- BOOKINGS
-- =========================================
DECLARE @CustomerID INT;
DECLARE @CourtID1 INT;
DECLARE @CourtID2 INT;
DECLARE @CoachID INT;

SELECT @CustomerID = UserID
FROM Users
WHERE Email = 'nguyenhoangnam.customer@gmail.com';

SELECT @CourtID1 = CourtID
FROM Courts
WHERE CourtCode = 'PCS-C01';

SELECT @CourtID2 = CourtID
FROM Courts
WHERE CourtCode = 'PCS-C03';

SELECT @CoachID = c.CoachID
FROM Coaches c
JOIN Users u ON c.UserID = u.UserID
WHERE u.Email = 'tranquochuy.coach@gmail.com';

INSERT INTO Bookings
(
    BookingCode,
    UserID,
    CourtID,
    CoachID,
    BookingType,
    BookingDate,
    StartTime,
    EndTime,
    TotalAmount,
    Status
)
VALUES
(
    'BK-20260601-001',
    @CustomerID,
    @CourtID1,
    NULL,
    'Court',
    '2026-06-01',
    '18:00',
    '20:00',
    500000,
    'Confirmed'
),
(
    'BK-20260602-002',
    @CustomerID,
    @CourtID2,
    @CoachID,
    'Combo',
    '2026-06-02',
    '19:00',
    '21:00',
    1440000,
    'Pending'
);

-- =========================================
-- PAYMENTS
-- =========================================
DECLARE @BookingID INT;

SELECT @BookingID = BookingID
FROM Bookings
WHERE BookingCode = 'BK-20260601-001';

INSERT INTO Payments
(
    BookingID,
    PaymentMethod,
    Amount,
    TransactionCode,
    Status,
    PaidAt
)
VALUES
(
    @BookingID,
    'VNPay',
    500000,
    'VNPAY-PCS-20260601-001',
    'Paid',
    GETDATE()
);

-- =========================================
-- REVIEWS
-- =========================================
INSERT INTO Reviews
(
    UserID,
    CourtID,
    CoachID,
    Rating,
    Comment,
    Status
)
VALUES
(
    @CustomerID,
    @CourtID1,
    NULL,
    5,
    N'Sân sạch, ánh sáng tốt, nhân viên hỗ trợ nhanh và đặt lịch rất thuận tiện.',
    'Visible'
);


INSERT INTO Vouchers
(
    VoucherCode,
    VoucherName,
    Description,
    DiscountType,
    DiscountValue,
    MinOrderAmount,
    StartDate,
    EndDate,
    Status
)
VALUES
(
    'PCSCOACH20',
    N'Giảm 20% combo sân và Coach',
    N'Áp dụng khi đặt sân kèm Coach lần đầu.',
    'Percent',
    20,
    500000,
    '2026-06-01',
    '2026-12-31',
    'Active'
),
(
    'COACH30',
    N'Giảm 150K khi đặt Coach',
    N'Áp dụng khi đặt Coach từ 2 giờ trở lên.',
    'Amount',
    150000,
    800000,
    '2026-06-01',
    '2026-12-31',
    'Active'
),
(
    'TEAM100',
    N'Giảm 100K cho nhóm chơi',
    N'Áp dụng cho nhóm từ 4 người đặt sân.',
    'Amount',
    100000,
    400000,
    '2026-06-01',
    '2026-12-31',
    'Active'
);