-- MediVault Password Reset Migration
-- Add reset code and token columns to Users and Admins tables

-- Add columns to Users table
ALTER TABLE Users
ADD COLUMN reset_code VARCHAR(6) NULL DEFAULT NULL,
ADD COLUMN reset_code_expiry DATETIME NULL DEFAULT NULL,
ADD COLUMN reset_token VARCHAR(255) NULL DEFAULT NULL,
ADD INDEX idx_reset_token (reset_token),
ADD INDEX idx_email (email);

-- Add columns to Admins table
ALTER TABLE Admins
ADD COLUMN reset_code VARCHAR(6) NULL DEFAULT NULL,
ADD COLUMN reset_code_expiry DATETIME NULL DEFAULT NULL,
ADD COLUMN reset_token VARCHAR(255) NULL DEFAULT NULL,
ADD INDEX idx_reset_token (reset_token),
ADD INDEX idx_email (email);

-- Verify columns were added
SHOW COLUMNS FROM Users LIKE 'reset_%';
SHOW COLUMNS FROM Admins LIKE 'reset_%';
