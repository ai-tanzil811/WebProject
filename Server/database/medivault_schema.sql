-- MediVault Complete Database Schema
-- Drop existing database and create fresh
DROP DATABASE IF EXISTS medivault;
CREATE DATABASE medivault;
USE medivault;

-- ==================== USERS TABLE ====================
CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nid VARCHAR(50) UNIQUE NOT NULL,
  age INT NOT NULL,
  photo_image_path VARCHAR(500) NULL,
  photo_image_type VARCHAR(50) NULL,
  reset_code VARCHAR(6) NULL DEFAULT NULL,
  reset_code_expiry DATETIME NULL DEFAULT NULL,
  reset_token VARCHAR(255) NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_reset_token (reset_token),
  INDEX idx_nid (nid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ADMINS TABLE ====================
CREATE TABLE Admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  shop_banner_image_path VARCHAR(500) NULL,
  shop_banner_image_type VARCHAR(50) NULL,
  reset_code VARCHAR(6) NULL DEFAULT NULL,
  reset_code_expiry DATETIME NULL DEFAULT NULL,
  reset_token VARCHAR(255) NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MEDICINES TABLE ====================
CREATE TABLE Medicines (
  medicine_id INT AUTO_INCREMENT PRIMARY KEY,
  generic_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  strength VARCHAR(100),
  dosage_form VARCHAR(100),
  manufacturer VARCHAR(255),
  batch_number VARCHAR(100),
  expiry_date DATE,
  quantity INT DEFAULT 0,
  price DECIMAL(10, 2),
  is_restricted BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_generic_name (generic_name),
  INDEX idx_brand_name (brand_name),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_quantity (quantity),
  INDEX idx_dosage_form (dosage_form),
  INDEX idx_is_restricted (is_restricted),
  CONSTRAINT chk_medicines_quantity_nonnegative CHECK (quantity >= 0),
  CONSTRAINT chk_medicines_price_nonnegative CHECK (price IS NULL OR price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== DRUG CONFLICTS TABLE ====================
CREATE TABLE DrugConflicts (
  conflict_id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id_1 INT NOT NULL,
  medicine_id_2 INT NOT NULL,
  conflict_level ENUM('mild', 'moderate', 'severe') DEFAULT 'moderate',
  description TEXT,
  recommendation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id_1) REFERENCES Medicines(medicine_id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id_2) REFERENCES Medicines(medicine_id) ON DELETE CASCADE,
  UNIQUE KEY unique_conflict (medicine_id_1, medicine_id_2),
  INDEX idx_conflict_level (conflict_level),
  INDEX idx_medicine_id_1 (medicine_id_1),
  INDEX idx_medicine_id_2 (medicine_id_2),
  CONSTRAINT chk_conflict_distinct_medicines CHECK (medicine_id_1 <> medicine_id_2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ORDER STATUSES TABLE ====================
CREATE TABLE OrderStatuses (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  status_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default order statuses
INSERT INTO OrderStatuses (status_name, description) VALUES
('pending', 'Order is pending confirmation'),
('confirmed', 'Order has been confirmed'),
('processing', 'Order is being processed'),
('shipped', 'Order has been shipped'),
('delivered', 'Order has been delivered'),
('cancelled', 'Order has been cancelled'),
('failed', 'Order processing failed');

-- ==================== ORDERS TABLE ====================
CREATE TABLE Orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2),
  status_id INT NOT NULL DEFAULT 1,
  admin_id INT NULL,
  notes TEXT,
  delivery_date DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (status_id) REFERENCES OrderStatuses(status_id),
  FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_order_date (order_date),
  INDEX idx_status_id (status_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ORDER ITEMS TABLE ====================
CREATE TABLE OrderItems (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  medicine_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2),
  subtotal DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id),
  INDEX idx_medicine_id (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PRESCRIPTION REVIEWS TABLE ====================
CREATE TABLE PrescriptionReviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  admin_id INT NULL,
  review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  prescription_path VARCHAR(255) NULL,
  review_notes TEXT,
  conflict_detected BOOLEAN DEFAULT FALSE,
  conflict_details TEXT,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id),
  INDEX idx_review_status (review_status),
  INDEX idx_admin_id (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PRESCRIPTION UPLOADS TABLE ====================
CREATE TABLE PrescriptionUploads (
  upload_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  admin_id INT NULL,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_admin_id_upload (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ACTIVITY LOGS TABLE ====================
CREATE TABLE ActivityLogs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  admin_id INT NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL,
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== USER NOTIFICATIONS TABLE ====================
CREATE TABLE UserNotifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'info',
  reference_type VARCHAR(100) NULL,
  reference_id INT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== COMPLIANCE REPORTS TABLE ====================
CREATE TABLE ComplianceReports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  report_date DATE NOT NULL,
  total_medicines INT,
  total_inventory_value DECIMAL(12, 2),
  low_stock_items INT,
  out_of_stock_items INT,
  expired_medicines INT,
  expiring_soon INT,
  restricted_medicines INT,
  todays_orders_count INT,
  todays_orders_quantity INT,
  todays_orders_value DECIMAL(12, 2),
  reserved_medicines_quantity INT,
  pending_orders_count INT,
  report_data LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE CASCADE,
  INDEX idx_report_date (report_date),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== VERIFY TABLES ====================
SHOW TABLES;
SHOW COLUMNS FROM Users;
SHOW COLUMNS FROM Admins;
