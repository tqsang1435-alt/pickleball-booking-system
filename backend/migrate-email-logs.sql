USE PCS_SYSTEM;

IF OBJECT_ID('dbo.EmailNotificationLogs', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[EmailNotificationLogs] (
        [EmailLogID] INT IDENTITY(1,1) PRIMARY KEY,
        [UserID] INT NOT NULL,
        [Email] NVARCHAR(255) NOT NULL,
        [NotificationType] NVARCHAR(50) NOT NULL,
        [RefType] NVARCHAR(50) NULL,
        [RefID] INT NULL,
        [GroupID] INT NULL,
        [SentAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Sent',
        [ErrorMessage] NVARCHAR(MAX) NULL,
        CONSTRAINT [FK_EmailNotificationLogs_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users]([UserID])
    );
    PRINT 'Table EmailNotificationLogs created.';
END
ELSE
BEGIN
    PRINT 'Table EmailNotificationLogs already exists.';
END

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_EmailNotificationLogs_UserID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_EmailNotificationLogs_UserID] ON [dbo].[EmailNotificationLogs]([UserID]);
    PRINT 'Index IX_EmailNotificationLogs_UserID created.';
END

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_EmailNotificationLogs_GroupID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_EmailNotificationLogs_GroupID] ON [dbo].[EmailNotificationLogs]([GroupID]);
    PRINT 'Index IX_EmailNotificationLogs_GroupID created.';
END

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_EmailNotificationLogs_Type_Time')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_EmailNotificationLogs_Type_Time] ON [dbo].[EmailNotificationLogs]([NotificationType], [SentAt]);
    PRINT 'Index IX_EmailNotificationLogs_Type_Time created.';
END
