# MediVault API Reference & Database Schema

## 📡 API Endpoints Quick Reference

### Base URL
```
http://localhost:3000/api
```

---

## Authentication Endpoints

### 1. User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "login_role": "user"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "redirect": "/pages/Shopping.html"
}
```

### 2. Admin Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123",
  "login_role": "admin"
}

Response:
{
  "success": true,
  "redirect": "/pages/Admin_dashboard.html"
}
```

### 3. Check Authentication Status
```http
GET /auth/status

Response:
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### 4. User Registration
```http
POST /auth/register-user
Content-Type: multipart/form-data

Parameters:
- name: "John Doe"
- email: "john@example.com"
- password: "Password123"
- nid: "1234567890"
- age: "25"
- photo: (file - optional)

Response:
{
  "success": true,
  "message": "User account created successfully"
}
```

### 5. Admin Registration
```http
POST /auth/register-admin
Content-Type: multipart/form-data

Parameters:
- name: "Admin User"
- email: "admin@example.com"
- password: "Admin123"
- shopBanner: (file - optional)

Response:
{
  "success": true,
  "message": "Admin account created successfully"
}
```

### 6. Request Password Reset
```http
POST /auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Reset code sent to your email",
  "resetToken": "abc123def456...",
  "userType": "user"
}
```

### 7. Verify Reset Code
```http
POST /auth/verify-reset-code
Content-Type: application/json

{
  "email": "user@example.com",
  "resetCode": "123456"
}

Response:
{
  "success": true,
  "message": "Code verified",
  "resetToken": "abc123def456...",
  "userType": "user"
}
```

### 8. Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "resetToken": "abc123def456...",
  "newPassword": "NewPassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 9. Logout
```http
POST /auth/logout

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Medicines Endpoints

### 1. List All Medicines
```http
GET /medicines?page=1&limit=20&search=aspirin&strength=500mg

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search: string (optional - search in name)
- strength: string (optional - filter by strength)

Response:
{
  "success": true,
  "medicines": [
    {
      "medicine_id": 1,
      "generic_name": "Aspirin",
      "brand_name": "Aspro",
      "strength": "500mg",
      "dosage_form": "Tablet",
      "manufacturer": "Pharma Inc",
      "price": 50.00,
      "quantity": 100,
      "is_restricted": false,
      "description": "Pain reliever..."
    }
  ],
  "total": 50,
  "page": 1
}
```

### 2. Get Single Medicine
```http
GET /medicines/1

Response:
{
  "success": true,
  "medicine": {
    "medicine_id": 1,
    "generic_name": "Aspirin",
    "brand_name": "Aspro",
    "strength": "500mg",
    "dosage_form": "Tablet",
    "manufacturer": "Pharma Inc",
    "price": 50.00,
    "quantity": 100,
    "is_restricted": false,
    "expiry_date": "2026-12-31",
    "batch_number": "BATCH001",
    "description": "Pain reliever..."
  }
}
```

### 3. Search Medicines
```http
POST /medicines/search
Content-Type: application/json

{
  "keyword": "aspirin",
  "strength": "500mg",
  "dosageForm": "Tablet"
}

Response:
{
  "success": true,
  "medicines": [...]
}
```

---

## Cart Endpoints

### 1. Add Item to Cart
```http
POST /cart/add
Content-Type: application/json

{
  "medicine_id": 1,
  "quantity": 2
}

Response:
{
  "success": true,
  "message": "Item added to cart",
  "cart": {
    "items": [
      {
        "medicine_id": 1,
        "quantity": 2,
        "price": 50.00,
        "subtotal": 100.00
      }
    ],
    "total": 100.00
  }
}
```

### 2. Remove Item from Cart
```http
POST /cart/remove
Content-Type: application/json

{
  "medicine_id": 1
}

Response:
{
  "success": true,
  "message": "Item removed from cart"
}
```

### 3. View Cart
```http
GET /cart/view

Response:
{
  "success": true,
  "cart": {
    "items": [
      {
        "medicine_id": 1,
        "generic_name": "Aspirin",
        "quantity": 2,
        "price": 50.00,
        "subtotal": 100.00
      }
    ],
    "total": 100.00,
    "itemCount": 1
  }
}
```

### 4. Check Drug Conflicts ⭐ CORE FEATURE
```http
POST /cart/check-conflicts
Content-Type: application/json

{
  "medicine_ids": [1, 2]
}

Response (No Conflicts):
{
  "success": true,
  "conflicts": [],
  "message": "No conflicts detected"
}

Response (Conflicts Found):
{
  "success": true,
  "conflicts": [
    {
      "medicine_id_1": 1,
      "medicine_id_2": 2,
      "conflict_level": "moderate",
      "medicine_1_name": "Aspirin",
      "medicine_2_name": "Ibuprofen",
      "description": "Both are NSAIDs, combining increases GI bleeding risk",
      "recommendation": "Use only one NSAID at a time"
    }
  ],
  "canCheckout": false
}
```

---

## Orders Endpoints

### 1. Create Order
```http
POST /orders/create
Content-Type: application/json
Authorization: Session Cookie Required

{
  "deliveryAddress": "123 Main St, City",
  "city": "New York",
  "postalCode": "10001",
  "specialInstructions": "Handle with care"
}

Response:
{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "order_id": 100,
    "user_id": 1,
    "order_date": "2026-05-13T10:30:00Z",
    "total_amount": 500.00,
    "status": "pending",
    "items": [
      {
        "medicine_id": 1,
        "quantity": 2,
        "unit_price": 50.00,
        "subtotal": 100.00
      }
    ]
  }
}
```

### 2. Get Order History
```http
GET /orders/history?page=1&limit=10

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)

Response:
{
  "success": true,
  "orders": [
    {
      "order_id": 100,
      "order_date": "2026-05-13",
      "total_amount": 500.00,
      "status": "pending",
      "itemCount": 2
    }
  ],
  "total": 10,
  "page": 1
}
```

### 3. Get Order Details
```http
GET /orders/100

Response:
{
  "success": true,
  "order": {
    "order_id": 100,
    "user_id": 1,
    "order_date": "2026-05-13T10:30:00Z",
    "total_amount": 500.00,
    "status": "pending",
    "delivery_date": null,
    "items": [
      {
        "medicine_id": 1,
        "generic_name": "Aspirin",
        "brand_name": "Aspro",
        "quantity": 2,
        "unit_price": 50.00,
        "subtotal": 100.00
      }
    ]
  }
}
```

---

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Not logged in |
| 404 | Not Found | Medicine doesn't exist |
| 409 | Conflict | Email already registered |
| 500 | Server Error | Database connection failed |

---

## Database Schema

### Users Table
```sql
CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nid VARCHAR(50) UNIQUE NOT NULL,
  age INT NOT NULL,
  photo_image_path VARCHAR(500),
  photo_image_type VARCHAR(50),
  reset_code VARCHAR(6),
  reset_code_expiry DATETIME,
  reset_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_reset_token (reset_token),
  INDEX idx_nid (nid)
);
```

### Admins Table
```sql
CREATE TABLE Admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  shop_banner_image_path VARCHAR(500),
  shop_banner_image_type VARCHAR(50),
  reset_code VARCHAR(6),
  reset_code_expiry DATETIME,
  reset_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_reset_token (reset_token)
);
```

### Medicines Table
```sql
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
  INDEX idx_expiry_date (expiry_date)
);
```

### DrugConflicts Table
```sql
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
  INDEX idx_conflict_level (conflict_level)
);
```

### Orders Table
```sql
CREATE TABLE Orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2),
  status_id INT NOT NULL DEFAULT 1,
  admin_id INT,
  notes TEXT,
  delivery_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (status_id) REFERENCES OrderStatuses(status_id),
  FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_order_date (order_date),
  INDEX idx_status_id (status_id)
);
```

### OrderItems Table
```sql
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
);
```

### PrescriptionReviews Table
```sql
CREATE TABLE PrescriptionReviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  admin_id INT NOT NULL,
  review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  review_notes TEXT,
  conflict_detected BOOLEAN DEFAULT FALSE,
  conflict_details TEXT,
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_review_status (review_status),
  INDEX idx_admin_id (admin_id)
);
```

### OrderStatuses Table
```sql
CREATE TABLE OrderStatuses (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  status_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

-- Default statuses:
-- 1: pending
-- 2: confirmed
-- 3: processing
-- 4: shipped
-- 5: delivered
-- 6: cancelled
-- 7: failed
```

---

## Example API Calls using curl

### Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "login_role": "user"
  }'
```

### Get Medicines
```bash
curl http://localhost:3000/api/medicines?page=1&limit=20
```

### Check Conflicts
```bash
curl -X POST http://localhost:3000/api/cart/check-conflicts \
  -H "Content-Type: application/json" \
  -d '{
    "medicine_ids": [1, 2]
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryAddress": "123 Main St",
    "city": "New York",
    "postalCode": "10001",
    "specialInstructions": "Handle carefully"
  }'
```

---

