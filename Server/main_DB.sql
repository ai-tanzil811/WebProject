-- MediVault - Local Dispensary Management
-- Database Schema (Updated with Admin Approvals & BLOBs)

-- 1. ADMINS TABLE (Restored for dashboard login)
CREATE TABLE Admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    shop_banner_image_path VARCHAR(255),
    shop_banner_image_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USERS TABLE
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nid VARCHAR(50) UNIQUE NOT NULL,
    age INT NOT NULL,
    photo_image_path VARCHAR(255),
    photo_image_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. MEDICINES TABLE (Simplified Inventory)
CREATE TABLE Medicines (
    med_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    dosaage_instructions TEXT,
    storage_instructions TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_level INT NOT NULL DEFAULT 0,
    exp_date DATE NOT NULL,
    prescription_required BOOLEAN DEFAULT FALSE,
    med_image_path VARCHAR(255),
    med_image_type VARCHAR(50)
) ENGINE=InnoDB;

-- 4. DRUG CONFLICTS
CREATE TABLE Drug_Conflicts (
    conflict_id INT AUTO_INCREMENT PRIMARY KEY,
    drug1_id INT NOT NULL,
    drug2_id INT NOT NULL,
    description TEXT NOT NULL,
    classification VARCHAR(50),
    FOREIGN KEY (drug1_id) REFERENCES Medicines(med_id) ON DELETE CASCADE,
    FOREIGN KEY (drug2_id) REFERENCES Medicines(med_id) ON DELETE CASCADE,
    UNIQUE (drug1_id, drug2_id)
) ENGINE=InnoDB;

-- 5. ORDER STATUSES (Lookup Table)
-- Insert these values manually:
-- 1: 'Pending Approval', 2: 'Approved/Ready', 3: 'Rejected', 4: 'Completed'
CREATE TABLE Order_Statuses (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

-- 6. ORDERS (Cart/Checkout)
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status_id INT NOT NULL DEFAULT 1,
    prescription_image_path VARCHAR(255),
    prescription_image_type VARCHAR(50),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES Order_Statuses(status_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6b. PRESCRIPTION REVIEWS (Admin approval for restricted orders)
CREATE TABLE Prescription_Reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    admin_id INT NULL,
    decision VARCHAR(20) NOT NULL, -- e.g., 'Approved', 'Rejected', 'Pending'
    notes TEXT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. ORDER ITEMS (Medicines in the Cart)
CREATE TABLE Order_Items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    med_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (med_id) REFERENCES Medicines(med_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 8. ACTIVITY LOGS (For Admin Dashboard "Recent Activity")
-- Tracks Interaction Alerts, Prescription uploads, etc.
CREATE TABLE Activity_Logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    log_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    order_id INT NULL,
    review_id INT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
    ,FOREIGN KEY (review_id) REFERENCES Prescription_Reviews(review_id) ON DELETE SET NULL
) ENGINE=InnoDB;
