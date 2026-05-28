



-- =========================
-- 1. ROLES
-- =========================
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Inactive')),
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- =========================
-- 2. PERMISSIONS
-- =========================
CREATE TABLE Permissions (
    PermissionID INT IDENTITY(1,1) PRIMARY KEY,
    PermissionCode NVARCHAR(100) NOT NULL UNIQUE,
    PermissionName NVARCHAR(100) NOT NULL,
    ModuleName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Inactive')),
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- =========================
-- 3. ROLE_PERMISSIONS
-- =========================
CREATE TABLE RolePermissions (
    RolePermissionID INT IDENTITY(1,1) PRIMARY KEY,
    RoleID INT NOT NULL,
    PermissionID INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
    FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID),
    CONSTRAINT UQ_Role_Permission UNIQUE (RoleID, PermissionID)
);

-- =========================
-- 4. USERS
-- =========================
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PhoneNumber NVARCHAR(20) UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    AvatarURL NVARCHAR(255),
    Gender NVARCHAR(20)
        CHECK (Gender IN ('Male', 'Female', 'Other')),
    DateOfBirth DATE,
    Address NVARCHAR(255),

    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    LockedUntil DATETIME NULL,

    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Inactive', 'Locked', 'Pending')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME
);

-- =========================
-- 5. USER_ROLES
-- =========================
CREATE TABLE UserRoles (
    UserRoleID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
    CONSTRAINT UQ_User_Role UNIQUE (UserID, RoleID)
);

-- =========================
-- 6. COURTS
-- =========================
CREATE TABLE Courts (
    CourtID INT IDENTITY(1,1) PRIMARY KEY,
    CourtCode NVARCHAR(50) NOT NULL UNIQUE,
    CourtName NVARCHAR(100) NOT NULL,
    CourtType NVARCHAR(50) NOT NULL
        CHECK (CourtType IN ('Indoor', 'Outdoor')),
    Location NVARCHAR(255),
    Description NVARCHAR(500),
    PricePerHour DECIMAL(18,2) NOT NULL
        CHECK (PricePerHour BETWEEN 100000 AND 1000000),
    CourtImage NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Available'
        CHECK (Status IN ('Available', 'Maintenance', 'Inactive')),

    OpenTime TIME NOT NULL,
    CloseTime TIME NOT NULL,

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    CONSTRAINT CK_Courts_Time CHECK (OpenTime < CloseTime)
);

-- =========================
-- 7. COURT_SLOTS
-- =========================
CREATE TABLE CourtSlots (
    SlotID INT IDENTITY(1,1) PRIMARY KEY,
    CourtID INT NOT NULL,
    SlotDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Price DECIMAL(18,2) NOT NULL,

    Status NVARCHAR(30) NOT NULL DEFAULT 'Available'
        CHECK (Status IN ('Available', 'Holding', 'Booked', 'Blocked', 'Maintenance')),

    HoldUntil DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID),

    CONSTRAINT CK_CourtSlots_Time CHECK (StartTime < EndTime),
    CONSTRAINT UQ_CourtSlot UNIQUE (CourtID, SlotDate, StartTime, EndTime)
);

-- =========================
-- 8. COACHES
-- =========================
CREATE TABLE Coaches (
    CoachID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,

    ExperienceYears INT NOT NULL DEFAULT 0 CHECK (ExperienceYears >= 0),
    SkillLevel NVARCHAR(30)
        CHECK (SkillLevel IN ('Beginner', 'Intermediate', 'Advanced', 'Professional')),
    Specialization NVARCHAR(255),
    Certifications NVARCHAR(255),
    HourlyRate DECIMAL(18,2) NOT NULL CHECK (HourlyRate >= 0),
    Biography NVARCHAR(MAX),

    AverageRating DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (AverageRating BETWEEN 0 AND 5),
    TotalStudents INT NOT NULL DEFAULT 0 CHECK (TotalStudents >= 0),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Inactive')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- =========================
-- 9. COACH_SCHEDULES
-- =========================
CREATE TABLE CoachSchedules (
    CoachScheduleID INT IDENTITY(1,1) PRIMARY KEY,
    CoachID INT NOT NULL,
    WorkingDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,

    Status NVARCHAR(30) NOT NULL DEFAULT 'Available'
        CHECK (Status IN ('Available', 'Holding', 'Booked', 'Cancelled', 'Unavailable')),

    HoldUntil DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (CoachID) REFERENCES Coaches(CoachID),

    CONSTRAINT CK_CoachSchedules_Time CHECK (StartTime < EndTime),
    CONSTRAINT UQ_CoachSchedule UNIQUE (CoachID, WorkingDate, StartTime, EndTime)
);

-- =========================
-- 10. PLAYER_PROFILES
-- =========================
CREATE TABLE PlayerProfiles (
    PlayerProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,

    PlayingRole NVARCHAR(30)
        CHECK (PlayingRole IN ('Attacker', 'Defender', 'All-rounder')),
    ExperienceYears INT NOT NULL DEFAULT 0 CHECK (ExperienceYears >= 0),
    SkillLevel NVARCHAR(30)
        CHECK (SkillLevel IN ('Beginner', 'Intermediate', 'Advanced')),
    PlayStyle NVARCHAR(100),
    Goal NVARCHAR(255),
    Rating DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (Rating BETWEEN 0 AND 5),

    MatchingStatus NVARCHAR(30) NOT NULL DEFAULT 'Available'
        CHECK (MatchingStatus IN ('Available', 'Busy', 'Hidden')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- =========================
-- 11. PROMOTIONS
-- =========================
CREATE TABLE Promotions (
    PromotionID INT IDENTITY(1,1) PRIMARY KEY,
    PromotionCode NVARCHAR(50) NOT NULL UNIQUE,
    PromotionName NVARCHAR(100) NOT NULL,

    DiscountType NVARCHAR(20) NOT NULL
        CHECK (DiscountType IN ('Percent', 'Fixed')),
    DiscountValue DECIMAL(18,2) NOT NULL CHECK (DiscountValue > 0),
    MaxDiscountAmount DECIMAL(18,2) NULL,
    MinOrderAmount DECIMAL(18,2) NOT NULL DEFAULT 0,

    UsageLimit INT NULL,
    UsedCount INT NOT NULL DEFAULT 0,

    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,

    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Inactive', 'Expired')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT CK_Promotions_Date CHECK (StartDate <= EndDate)
);

-- =========================
-- 12. BOOKINGS
-- =========================
CREATE TABLE Bookings (
    BookingID INT IDENTITY(1,1) PRIMARY KEY,
    BookingCode NVARCHAR(50) NOT NULL UNIQUE,

    UserID INT NOT NULL,
    PromotionID INT NULL,

    BookingType NVARCHAR(30) NOT NULL
        CHECK (BookingType IN ('Court', 'Coach', 'Combo')),

    BookingDate DATE NOT NULL,

    CourtFee DECIMAL(18,2) NOT NULL DEFAULT 0,
    CoachFee DECIMAL(18,2) NOT NULL DEFAULT 0,
    DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18,2) NOT NULL CHECK (TotalAmount >= 0),

    Status NVARCHAR(30) NOT NULL DEFAULT 'PendingPayment'
        CHECK (Status IN (
            'PendingPayment',
            'Paid',
            'Confirmed',
            'CheckedIn',
            'Completed',
            'Cancelled',
            'Refunded',
            'NoShow'
        )),

    CheckInTime DATETIME NULL,
    CancelledAt DATETIME NULL,
    CancelReason NVARCHAR(255),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (PromotionID) REFERENCES Promotions(PromotionID)
);

-- =========================
-- 13. BOOKING_DETAILS
-- =========================
CREATE TABLE BookingDetails (
    BookingDetailID INT IDENTITY(1,1) PRIMARY KEY,

    BookingID INT NOT NULL,
    SlotID INT NULL,
    CourtID INT NULL,
    CoachID INT NULL,
    CoachScheduleID INT NULL,

    BookingDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,

    CourtFee DECIMAL(18,2) NOT NULL DEFAULT 0,
    CoachFee DECIMAL(18,2) NOT NULL DEFAULT 0,
    SubTotal DECIMAL(18,2) NOT NULL DEFAULT 0,

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    FOREIGN KEY (SlotID) REFERENCES CourtSlots(SlotID),
    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID),
    FOREIGN KEY (CoachID) REFERENCES Coaches(CoachID),
    FOREIGN KEY (CoachScheduleID) REFERENCES CoachSchedules(CoachScheduleID),

    CONSTRAINT CK_BookingDetails_Time CHECK (StartTime < EndTime)
);

-- =========================
-- 14. PAYMENTS
-- =========================
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,

    PaymentMethod NVARCHAR(50) NOT NULL
        CHECK (PaymentMethod IN ('VNPay', 'Momo')),
    Amount DECIMAL(18,2) NOT NULL CHECK (Amount >= 0),

    TransactionCode NVARCHAR(100) UNIQUE,
    GatewayResponse NVARCHAR(MAX),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Paid', 'Failed', 'Refunded')),

    PaidAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
);

-- =========================
-- 15. REFUNDS
-- =========================
CREATE TABLE Refunds (
    RefundID INT IDENTITY(1,1) PRIMARY KEY,

    BookingID INT NOT NULL,
    PaymentID INT NOT NULL,

    RefundAmount DECIMAL(18,2) NOT NULL CHECK (RefundAmount >= 0),
    Reason NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Requested'
        CHECK (Status IN ('Requested', 'Approved', 'Rejected', 'Processing', 'Completed', 'Failed')),

    RequestedAt DATETIME NOT NULL DEFAULT GETDATE(),
    ProcessedAt DATETIME NULL,

    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID)
);

-- =========================
-- 16. REVIEWS
-- =========================
CREATE TABLE Reviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,

    BookingID INT NOT NULL,
    UserID INT NOT NULL,
    CourtID INT NULL,
    CoachID INT NULL,

    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(500),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Visible'
        CHECK (Status IN ('Visible', 'Hidden', 'Deleted')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID),
    FOREIGN KEY (CoachID) REFERENCES Coaches(CoachID),

    CONSTRAINT UQ_Review_Booking UNIQUE (BookingID)
);

-- =========================
-- 17. NOTIFICATIONS
-- =========================
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,

    UserID INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Message NVARCHAR(500) NOT NULL,

    NotificationType NVARCHAR(50) NOT NULL
        CHECK (NotificationType IN ('Booking', 'Payment', 'Refund', 'Reminder', 'Review', 'Matching', 'System')),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Unread'
        CHECK (Status IN ('Unread', 'Read', 'Deleted')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- =========================
-- 18. MAINTENANCE_SCHEDULES
-- =========================
CREATE TABLE MaintenanceSchedules (
    MaintenanceID INT IDENTITY(1,1) PRIMARY KEY,

    CourtID INT NOT NULL,
    MaintenanceDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Reason NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Scheduled'
        CHECK (Status IN ('Scheduled', 'InProgress', 'Completed', 'Cancelled')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID),

    CONSTRAINT CK_Maintenance_Time CHECK (StartTime < EndTime)
);

-- =========================
-- 19. COURT_ISSUES
-- =========================
CREATE TABLE CourtIssues (
    IssueID INT IDENTITY(1,1) PRIMARY KEY,

    CourtID INT NOT NULL,
    ReportedBy INT NOT NULL,
    IssueTitle NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Open'
        CHECK (Status IN ('Open', 'Processing', 'Resolved', 'Rejected')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID),
    FOREIGN KEY (ReportedBy) REFERENCES Users(UserID)
);

-- =========================
-- 20. PLAYING_GROUPS
-- =========================
CREATE TABLE PlayingGroups (
    GroupID INT IDENTITY(1,1) PRIMARY KEY,

    GroupName NVARCHAR(100) NOT NULL,
    CreatedBy INT NOT NULL,

    AverageExperience DECIMAL(4,1) NOT NULL DEFAULT 0,
    SkillLevel NVARCHAR(30)
        CHECK (SkillLevel IN ('Beginner', 'Intermediate', 'Advanced')),

    Description NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Open'
        CHECK (Status IN ('Open', 'Full', 'Closed')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

-- =========================
-- 21. GROUP_MEMBERS
-- =========================
CREATE TABLE GroupMembers (
    GroupMemberID INT IDENTITY(1,1) PRIMARY KEY,

    GroupID INT NOT NULL,
    UserID INT NOT NULL,

    RoleInGroup NVARCHAR(30) NOT NULL DEFAULT 'Member'
        CHECK (RoleInGroup IN ('Leader', 'Member')),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Left', 'Removed')),

    JoinedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (GroupID) REFERENCES PlayingGroups(GroupID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),

    CONSTRAINT UQ_Group_User UNIQUE (GroupID, UserID)
);

-- =========================
-- 22. PLAY_INVITATIONS
-- =========================
CREATE TABLE PlayInvitations (
    InvitationID INT IDENTITY(1,1) PRIMARY KEY,

    SenderID INT NOT NULL,
    ReceiverID INT NOT NULL,
    GroupID INT NULL,

    InvitationType NVARCHAR(30) NOT NULL DEFAULT 'Player'
        CHECK (InvitationType IN ('Player', 'Group')),

    Message NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled', 'Expired')),

    ExpiredAt DATETIME NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    RespondedAt DATETIME NULL,

    FOREIGN KEY (SenderID) REFERENCES Users(UserID),
    FOREIGN KEY (ReceiverID) REFERENCES Users(UserID),
    FOREIGN KEY (GroupID) REFERENCES PlayingGroups(GroupID)
);

-- =========================
-- 23. MATCHING_SUGGESTIONS
-- =========================
CREATE TABLE MatchingSuggestions (
    SuggestionID INT IDENTITY(1,1) PRIMARY KEY,

    UserID INT NOT NULL,
    SuggestedUserID INT NULL,
    SuggestedGroupID INT NULL,

    MatchingScore DECIMAL(5,2) NOT NULL CHECK (MatchingScore BETWEEN 0 AND 100),
    Reason NVARCHAR(500),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Suggested'
        CHECK (Status IN ('Suggested', 'Accepted', 'Rejected', 'Expired')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (SuggestedUserID) REFERENCES Users(UserID),
    FOREIGN KEY (SuggestedGroupID) REFERENCES PlayingGroups(GroupID)
);

-- =========================
-- 24. AI_RECOMMENDATIONS
-- =========================
CREATE TABLE AIRecommendations (
    AIRecommendationID INT IDENTITY(1,1) PRIMARY KEY,

    UserID INT NOT NULL,

    RecommendationType NVARCHAR(50) NOT NULL
        CHECK (RecommendationType IN ('Coach', 'Schedule', 'WorkoutRoadmap', 'PlayerMatching')),

    Content NVARCHAR(MAX) NOT NULL,
    MatchingScore DECIMAL(5,2) NULL CHECK (MatchingScore BETWEEN 0 AND 100),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Hidden', 'Expired')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- =========================
-- 25. COACH_INCOME
-- =========================
CREATE TABLE CoachIncome (
    IncomeID INT IDENTITY(1,1) PRIMARY KEY,

    CoachID INT NOT NULL,
    BookingID INT NOT NULL,

    GrossAmount DECIMAL(18,2) NOT NULL CHECK (GrossAmount >= 0),
    CommissionRate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (CommissionRate BETWEEN 0 AND 100),
    NetAmount DECIMAL(18,2) NOT NULL CHECK (NetAmount >= 0),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Calculated', 'Paid', 'Cancelled')),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    PaidAt DATETIME NULL,

    FOREIGN KEY (CoachID) REFERENCES Coaches(CoachID),
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
);

-- =========================
-- 26. AUDIT_LOGS
-- =========================
CREATE TABLE AuditLogs (
    AuditLogID INT IDENTITY(1,1) PRIMARY KEY,

    UserID INT NULL,
    ActionName NVARCHAR(100) NOT NULL,
    TableName NVARCHAR(100),
    EntityID INT NULL,
    Description NVARCHAR(500),
    IPAddress NVARCHAR(50),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- =========================
-- 27. SYSTEM_LOGS
-- =========================
CREATE TABLE SystemLogs (
    SystemLogID INT IDENTITY(1,1) PRIMARY KEY,

    LogLevel NVARCHAR(30) NOT NULL
        CHECK (LogLevel IN ('Info', 'Warning', 'Error', 'Critical')),
    Message NVARCHAR(MAX) NOT NULL,
    Source NVARCHAR(100),

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE EmailOtps (
    OtpID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    Email NVARCHAR(100) NOT NULL,
    OtpHash NVARCHAR(255) NOT NULL,

    Purpose NVARCHAR(30) NOT NULL
        CHECK (Purpose IN ('REGISTER', 'RESET_PASSWORD')),

    Attempts INT NOT NULL DEFAULT 0,
    IsUsed BIT NOT NULL DEFAULT 0,
    ExpiresAt DATETIME NOT NULL,

    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE PendingUsers (
    PendingUserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20),
    PasswordHash NVARCHAR(255) NOT NULL,
    Gender NVARCHAR(20),
    DateOfBirth DATE NULL,
    Address NVARCHAR(255),
    OtpHash NVARCHAR(255) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    IsVerified BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

INSERT INTO Roles (RoleName, Description, Status)
VALUES
('Admin', N'Quản trị hệ thống', 'Active'),
('Staff', N'Nhân viên', 'Active'),
('Coach', N'Huấn luyện viên', 'Active'),
('Player', N'Người chơi', 'Active');