-- SQL Schema


-- =========================
-- 1. ROLES
-- =========================
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Inactive')),
    CreatedAt DATETIME DEFAULT GETDATE()
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

    CreatedAt DATETIME DEFAULT GETDATE()
);

-- =========================
-- 3. ROLE_PERMISSIONS
-- =========================
CREATE TABLE RolePermissions (
    RolePermissionID INT IDENTITY(1,1) PRIMARY KEY,
    RoleID INT NOT NULL,
    PermissionID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

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
    PhoneNumber NVARCHAR(20),
    PasswordHash NVARCHAR(255) NOT NULL,
    AvatarURL NVARCHAR(255),
    Gender NVARCHAR(20)
        CHECK (Gender IN ('Male', 'Female', 'Other')),
    DateOfBirth DATE,
    Address NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Inactive', 'Locked', 'Pending')),

    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
);

-- =========================
-- 5. USER_ROLES
-- =========================
CREATE TABLE UserRoles (
    UserRoleID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

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
    Description NVARCHAR(255),
    PricePerHour DECIMAL(18,2) NOT NULL,
    CourtImage NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Available'
        CHECK (Status IN ('Available', 'Booked', 'Maintenance', 'Inactive')),

    OpenTime TIME NOT NULL,
    CloseTime TIME NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
);

-- =========================
-- 7. COACHES
-- =========================
CREATE TABLE Coaches (
    CoachID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    ExperienceYears INT DEFAULT 0,
    SkillLevel NVARCHAR(30)
        CHECK (SkillLevel IN ('Beginner', 'Intermediate', 'Advanced', 'Professional')),
    Specialization NVARCHAR(255),
    Certifications NVARCHAR(255),
    HourlyRate DECIMAL(18,2) NOT NULL,
    Biography NVARCHAR(MAX),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Inactive')),

    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- =========================
-- 8. PLAYER_PROFILES
-- =========================
CREATE TABLE PlayerProfiles (
    PlayerProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    PlayingRole NVARCHAR(30)
        CHECK (PlayingRole IN ('Attacker', 'Defender', 'All-rounder')),
    ExperienceYears INT DEFAULT 0,
    SkillLevel NVARCHAR(30)
        CHECK (SkillLevel IN ('Beginner', 'Intermediate', 'Advanced')),
    PlayStyle NVARCHAR(100),
    Rating DECIMAL(3,2) DEFAULT 0,

    MatchingStatus NVARCHAR(30) NOT NULL DEFAULT 'Available'
        CHECK (MatchingStatus IN ('Available', 'Busy', 'Hidden')),

    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- =========================
-- 9. COACH_SCHEDULES
-- =========================
CREATE TABLE CoachSchedules (
    CoachScheduleID INT IDENTITY(1,1) PRIMARY KEY,
    CoachID INT NOT NULL,
    AvailableDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,

    Status NVARCHAR(30) NOT NULL DEFAULT 'Available'
        CHECK (Status IN ('Available', 'Booked', 'Cancelled', 'Unavailable')),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CoachID) REFERENCES Coaches(CoachID)
);

-- =========================
-- 10. BOOKINGS
-- =========================
CREATE TABLE Bookings (
    BookingID INT IDENTITY(1,1) PRIMARY KEY,
    BookingCode NVARCHAR(50) NOT NULL UNIQUE,
    UserID INT NOT NULL,
    CourtID INT NULL,
    CoachID INT NULL,

    BookingType NVARCHAR(30) NOT NULL
        CHECK (BookingType IN ('Court', 'Coach', 'Combo')),

    BookingDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,

    TotalAmount DECIMAL(18,2) NOT NULL,

    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Confirmed', 'CheckedIn', 'Completed', 'Cancelled', 'NoShow')),

    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME,

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID),
    FOREIGN KEY (CoachID) REFERENCES Coaches(CoachID)
);

-- =========================
-- 11. PAYMENTS
-- =========================
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL
        CHECK (PaymentMethod IN ('Cash', 'Banking', 'VNPay', 'Momo', 'ZaloPay')),
    Amount DECIMAL(18,2) NOT NULL,
    TransactionCode NVARCHAR(100),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Paid', 'Failed', 'Refunded')),

    PaidAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
);

-- =========================
-- 12. REFUNDS
-- =========================
CREATE TABLE Refunds (
    RefundID INT IDENTITY(1,1) PRIMARY KEY,
    PaymentID INT NOT NULL,
    RefundAmount DECIMAL(18,2) NOT NULL,
    Reason NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Requested'
        CHECK (Status IN ('Requested', 'Approved', 'Rejected', 'Completed')),

    RequestedAt DATETIME DEFAULT GETDATE(),
    ProcessedAt DATETIME,

    FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID)
);

-- =========================
-- 13. REVIEWS
-- =========================
CREATE TABLE Reviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    CourtID INT NULL,
    CoachID INT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(500),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Visible'
        CHECK (Status IN ('Visible', 'Hidden', 'Deleted')),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID),
    FOREIGN KEY (CoachID) REFERENCES Coaches(CoachID)
);

-- =========================
-- 14. NOTIFICATIONS
-- =========================
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Message NVARCHAR(500) NOT NULL,

    Status NVARCHAR(30) NOT NULL DEFAULT 'Unread'
        CHECK (Status IN ('Unread', 'Read', 'Deleted')),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- =========================
-- 15. PROMOTIONS
-- =========================
CREATE TABLE Promotions (
    PromotionID INT IDENTITY(1,1) PRIMARY KEY,
    PromotionCode NVARCHAR(50) NOT NULL UNIQUE,
    PromotionName NVARCHAR(100) NOT NULL,
    DiscountPercent DECIMAL(5,2) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,

    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Inactive', 'Expired')),

    CreatedAt DATETIME DEFAULT GETDATE()
);

-- =========================
-- 16. MAINTENANCE_SCHEDULES
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

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID)
);

-- =========================
-- 17. COURT_ISSUES
-- =========================
CREATE TABLE CourtIssues (
    IssueID INT IDENTITY(1,1) PRIMARY KEY,
    CourtID INT NOT NULL,
    ReportedBy INT NOT NULL,
    IssueTitle NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Open'
        CHECK (Status IN ('Open', 'Processing', 'Resolved', 'Rejected')),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID),
    FOREIGN KEY (ReportedBy) REFERENCES Users(UserID)
);

-- =========================
-- 18. PLAYING_GROUPS
-- =========================
CREATE TABLE PlayingGroups (
    GroupID INT IDENTITY(1,1) PRIMARY KEY,
    GroupName NVARCHAR(100) NOT NULL,
    CreatedBy INT NOT NULL,
    SkillLevel NVARCHAR(30)
        CHECK (SkillLevel IN ('Beginner', 'Intermediate', 'Advanced')),
    Description NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Open'
        CHECK (Status IN ('Open', 'Full', 'Closed')),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

-- =========================
-- 19. GROUP_MEMBERS
-- =========================
CREATE TABLE GroupMembers (
    GroupMemberID INT IDENTITY(1,1) PRIMARY KEY,
    GroupID INT NOT NULL,
    UserID INT NOT NULL,

    RoleInGroup NVARCHAR(30) DEFAULT 'Member'
        CHECK (RoleInGroup IN ('Leader', 'Member')),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Left', 'Removed')),

    JoinedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (GroupID) REFERENCES PlayingGroups(GroupID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),

    CONSTRAINT UQ_Group_User UNIQUE (GroupID, UserID)
);

-- =========================
-- 20. PLAY_INVITATIONS
-- =========================
CREATE TABLE PlayInvitations (
    InvitationID INT IDENTITY(1,1) PRIMARY KEY,
    SenderID INT NOT NULL,
    ReceiverID INT NOT NULL,
    GroupID INT NULL,
    Message NVARCHAR(255),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled')),

    CreatedAt DATETIME DEFAULT GETDATE(),
    RespondedAt DATETIME,

    FOREIGN KEY (SenderID) REFERENCES Users(UserID),
    FOREIGN KEY (ReceiverID) REFERENCES Users(UserID),
    FOREIGN KEY (GroupID) REFERENCES PlayingGroups(GroupID)
);

-- =========================
-- 21. MATCHING_SUGGESTIONS
-- =========================
CREATE TABLE MatchingSuggestions (
    SuggestionID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    SuggestedUserID INT NULL,
    SuggestedGroupID INT NULL,

    MatchingScore DECIMAL(5,2) NOT NULL,
    Reason NVARCHAR(500),

    Status NVARCHAR(30) NOT NULL DEFAULT 'Suggested'
        CHECK (Status IN ('Suggested', 'Accepted', 'Rejected', 'Expired')),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (SuggestedUserID) REFERENCES Users(UserID),
    FOREIGN KEY (SuggestedGroupID) REFERENCES PlayingGroups(GroupID)
);

-- =========================
-- 22. AI_RECOMMENDATIONS
-- =========================
CREATE TABLE AIRecommendations (
    AIRecommendationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    RecommendationType NVARCHAR(50) NOT NULL
        CHECK (RecommendationType IN ('Coach', 'Schedule', 'WorkoutRoadmap', 'PlayerMatching')),
    Content NVARCHAR(MAX) NOT NULL,

    Status NVARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (Status IN ('Active', 'Hidden', 'Expired')),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- =========================
-- 23. AUDIT_LOGS
-- =========================
CREATE TABLE AuditLogs (
    AuditLogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    ActionName NVARCHAR(100) NOT NULL,
    TableName NVARCHAR(100),
    Description NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);




