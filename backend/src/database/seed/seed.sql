
GO

-- =====================================
-- ROLES
-- =====================================

INSERT INTO Roles (RoleName, Description)
VALUES
('Admin', 'System Administrator'),
('Manager', 'Business Manager'),
('Staff', 'Court Operation Staff'),
('Coach', 'Pickleball Coach'),
('Player', 'Normal Player'),
('Guest', 'Guest User'),
('Accountant', 'Finance Management'),
('Support', 'Customer Support'),
('Moderator', 'Review Moderator'),
('AIManager', 'AI Recommendation Manager');

-- =====================================
-- PERMISSIONS
-- =====================================

INSERT INTO Permissions
(PermissionCode, PermissionName, ModuleName, Description)
VALUES
('USER_VIEW', 'View Users', 'Users', 'Can view users'),
('USER_CREATE', 'Create User', 'Users', 'Can create users'),
('USER_UPDATE', 'Update User', 'Users', 'Can update users'),
('USER_DELETE', 'Delete User', 'Users', 'Can delete users'),
('COURT_VIEW', 'View Courts', 'Courts', 'Can view courts'),
('COURT_MANAGE', 'Manage Courts', 'Courts', 'Can manage courts'),
('BOOKING_CREATE', 'Create Booking', 'Bookings', 'Can create booking'),
('BOOKING_CANCEL', 'Cancel Booking', 'Bookings', 'Can cancel booking'),
('PAYMENT_PROCESS', 'Process Payment', 'Payments', 'Can process payment'),
('REPORT_VIEW', 'View Reports', 'Reports', 'Can view reports');

-- =====================================
-- ROLE PERMISSIONS
-- =====================================

INSERT INTO RolePermissions (RoleID, PermissionID)
VALUES
(1,1),
(1,2),
(1,3),
(1,4),
(1,5),
(1,6),
(1,7),
(1,8),
(1,9),
(1,10);

-- =====================================
-- USERS
-- Password bcrypt hash:
-- Password@123
-- =====================================

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
'Nguyen Minh Anh',
'nguyen.minhanh@gmail.com',
'0905123001',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user1.jpg',
'Male',
'1998-05-12',
'12 Nguyen Van Linh, Da Nang',
'Active'
),

(
'Tran Bao Chau',
'tran.baochau@gmail.com',
'0905123002',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user2.jpg',
'Female',
'2000-03-22',
'45 Le Duan, Da Nang',
'Active'
),

(
'Le Quoc Huy',
'le.quochuy@gmail.com',
'0905123003',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user3.jpg',
'Male',
'1997-08-11',
'78 Tran Phu, Da Nang',
'Active'
),

(
'Pham Gia Han',
'pham.giahan@gmail.com',
'0905123004',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user4.jpg',
'Female',
'1999-01-15',
'102 Vo Nguyen Giap, Da Nang',
'Active'
),

(
'Vo Thanh Dat',
'vo.thanhdat@gmail.com',
'0905123005',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user5.jpg',
'Male',
'1995-12-02',
'88 Nguyen Tat Thanh, Da Nang',
'Active'
),

(
'Hoang Thi Linh',
'hoang.thilinh@gmail.com',
'0905123006',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user6.jpg',
'Female',
'2001-06-19',
'19 Ong Ich Khiem, Da Nang',
'Active'
),

(
'Bui Tuan Kiet',
'bui.tuankiet@gmail.com',
'0905123007',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user7.jpg',
'Male',
'1996-09-25',
'65 Hai Phong, Da Nang',
'Active'
),

(
'Dang My Tien',
'dang.mytien@gmail.com',
'0905123008',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user8.jpg',
'Female',
'1998-11-09',
'44 Bach Dang, Da Nang',
'Active'
),

(
'Doan Anh Khoa',
'doan.anhkhoa@gmail.com',
'0905123009',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user9.jpg',
'Male',
'1994-04-14',
'91 Hoang Dieu, Da Nang',
'Active'
),

(
'Truong Nha Uyen',
'truong.nhauyen@gmail.com',
'0905123010',
'$2b$12$8wJwYQ8B7w3H5QmA8mP5u.6v3M2vNf5D1l0G5R8L2uK9vYzD2xF8W',
'/images/users/user10.jpg',
'Female',
'2002-07-30',
'22 Nguyen Huu Tho, Da Nang',
'Active'
);

-- =====================================
-- USER ROLES
-- =====================================

INSERT INTO UserRoles (UserID, RoleID)
VALUES
(1,1),
(2,5),
(3,4),
(4,5),
(5,2),
(6,3),
(7,5),
(8,4),
(9,5),
(10,5);

-- =====================================
-- COURTS
-- =====================================

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
('COURT-01','Sunrise Court','Indoor','Da Nang','Premium indoor court',350000,'/images/courts/c1.jpg','Available','05:00','23:00'),
('COURT-02','Ocean Court','Outdoor','Da Nang','Outdoor ocean view court',300000,'/images/courts/c2.jpg','Available','05:00','23:00'),
('COURT-03','Golden Smash','Indoor','Da Nang','Professional lighting court',400000,'/images/courts/c3.jpg','Available','05:00','23:00'),
('COURT-04','Blue Sky Court','Outdoor','Da Nang','Cool outdoor court',280000,'/images/courts/c4.jpg','Available','05:00','23:00'),
('COURT-05','Dragon Arena','Indoor','Da Nang','VIP indoor arena',500000,'/images/courts/c5.jpg','Available','05:00','23:00'),
('COURT-06','River Side Court','Outdoor','Da Nang','Near Han River',320000,'/images/courts/c6.jpg','Available','05:00','23:00'),
('COURT-07','Central Court','Indoor','Da Nang','City center court',370000,'/images/courts/c7.jpg','Available','05:00','23:00'),
('COURT-08','Mountain View Court','Outdoor','Da Nang','Beautiful mountain view',290000,'/images/courts/c8.jpg','Available','05:00','23:00'),
('COURT-09','Pink Pickle Arena','Indoor','Da Nang','Luxury pink theme court',450000,'/images/courts/c9.jpg','Available','05:00','23:00'),
('COURT-10','Champion Court','Indoor','Da Nang','Tournament standard court',550000,'/images/courts/c10.jpg','Available','05:00','23:00');

-- =====================================
-- COACHES
-- =====================================

INSERT INTO Coaches
(
UserID,
ExperienceYears,
SkillLevel,
Specialization,
Certifications,
HourlyRate,
Biography,
AverageRating,
TotalStudents,
Status
)
VALUES
(3,5,'Advanced','Beginner Training','PPR Certified',500000,'Experienced coach',4.8,120,'Approved'),
(8,7,'Professional','Professional Strategy','IPF Certified',700000,'Former national athlete',4.9,210,'Approved');

-- =====================================
-- PLAYER PROFILES
-- =====================================

INSERT INTO PlayerProfiles
(
UserID,
PlayingRole,
ExperienceYears,
SkillLevel,
PlayStyle,
Goal,
Rating,
MatchingStatus
)
VALUES
(2,'Attacker',2,'Intermediate','Aggressive','Improve smash',4.2,'Available'),
(4,'Defender',1,'Beginner','Safe play','Improve defense',3.8,'Available'),
(7,'All-rounder',3,'Advanced','Balanced','Tournament training',4.5,'Available'),
(9,'Attacker',4,'Advanced','Fast attack','Find strong partner',4.6,'Available'),
(10,'Defender',2,'Intermediate','Stable defense','Improve teamwork',4.1,'Available');

/*CourtSlots
Bookings
BookingDetails
Payments
Refunds
Reviews
Promotions
Notifications
PlayingGroups
GroupMembers
AIRecommendations*/



SELECT *
FROM CourtSlots
WHERE CourtID = 1
  AND SlotDate = '2026-05-25'
  AND StartTime = '18:00'
  AND EndTime = '19:00
  
  
  
  
  -- Admin: nguyen.minhanh@gmail.com
UPDATE Users
SET PasswordHash = '$2b$12$FBiGSbka7rclxw.D7Ot50OeQ1Kmi4en/RECQut9Y.EtfkS3Z9bXEe'
WHERE Email = 'nguyen.minhanh@gmail.com';

-- Staff: hoang.thilinh@gmail.com
UPDATE Users
SET PasswordHash = '$2b$12$TRZ68aTO.4gdChQQ68pHAOJQBPwFBxiNUvxmh07sL/DkeMHP0DZre'
WHERE Email = 'hoang.thilinh@gmail.com';

-- Coach: le.quochuy@gmail.com và dang.mytien@gmail.com
UPDATE Users
SET PasswordHash = '$2b$12$KyQEE3HyFw1Ixp5WJjM2tullJCDcFNDhFbRkyvncDIWClo1fl/juu'
WHERE Email IN ('le.quochuy@gmail.com', 'dang.mytien@gmail.com');';