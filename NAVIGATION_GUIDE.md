# MediVault Application Flow & Navigation Guide

## 📋 Table of Contents
1. [Page Structure](#page-structure)
2. [User Journey](#user-journey)
3. [Admin Journey](#admin-journey)
4. [API Endpoints](#api-endpoints)
5. [Email Setup Instructions](#email-setup-instructions)

---

## Page Structure

### Frontend Pages Organization
```
FrontEnd/
├── pages/
│   ├── LandingPage.html          ← Entry point
│   ├── User_login.html           ← User login
│   ├── User_register.html        ← User registration
│   ├── Admin_login.html          ← Admin login
│   ├── Admin_register.html       ← Admin registration
│   ├── ForgotPassword.html       ← Password recovery (both roles)
│   ├── Shopping.html             ← User medicine catalog
│   ├── Checkout.html             ← Order confirmation
│   ├── Admin_dashboard.html      ← Admin main page
│   ├── Admin_inventory.html      ← Manage medicines
│   ├── Admin_search.html         ← Search inventory
│   ├── Admin_conflicts.html      ← Drug interactions management
│   └── partials/
│       └── adminNavbar.html      ← Reusable admin navigation
├── script/
│   ├── login.js                  ← User/Admin login handler
│   ├── register.js               ← User/Admin registration handler
│   ├── forgotPassword.js         ← Password reset handler
│   ├── shopping.js               ← Shopping cart logic
│   ├── checkout.js               ← Order placement
│   ├── adminDashboard.js         ← Admin dashboard
│   ├── adminInventory.js         ← Inventory management
│   ├── adminSearch.js            ← Inventory search
│   ├── adminNavbar.js            ← Navigation handler
│   └── adminConflicts.js         ← Drug conflicts display
└── Styles/
    └── [CSS files for each page]
```

---

## User Journey

### 1. **Landing Page** (`LandingPage.html`)
- **Purpose**: Entry point for all users
- **Navigation**:
  - Click "User Sign In" → Goes to `User_login.html`
  - Click "Admin Sign In" → Goes to `Admin_login.html`
  - Click "Register" → Shows options for user/admin registration
- **Scripts**: None (static content)

### 2. **User Login** (`User_login.html`)
- **Purpose**: Authenticate users
- **Scripts**: `login.js`
- **API Call**: `POST /api/auth/login`
- **On Success**:
  - Session created with user info
  - Redirects to `Shopping.html`
- **On Failure**:
  - Shows error message
  - User can retry or reset password
- **Links**:
  - "Don't have account?" → `User_register.html`
  - "Forgot Password?" → `ForgotPassword.html`

### 3. **User Registration** (`User_register.html`)
- **Purpose**: Create new user account
- **Scripts**: `register.js`
- **API Call**: `POST /api/auth/register-user`
- **Form Fields**:
  - Name, Email, Password, Confirm Password
  - NID (National ID), Age
  - Photo upload (optional)
- **On Success**:
  - Account created
  - Redirects to `User_login.html` after 2 seconds
- **Links**:
  - "Already have account?" → `User_login.html`

### 4. **Shopping Page** (`Shopping.html`)
- **Purpose**: Browse and purchase medicines
- **Scripts**: `shopping.js`
- **Features**:
  - Display all available medicines
  - Search by name or generic name
  - Filter by strength and dosage form
  - Add/remove items from cart
  - View cart summary
  - **Check for drug interactions** before checkout
- **API Calls**:
  - `GET /api/medicines` - List all medicines
  - `POST /api/cart/add` - Add item to cart
  - `POST /api/cart/remove` - Remove item from cart
  - `GET /api/cart/view` - View current cart
  - `POST /api/cart/check-conflicts` - Check drug interactions ⭐
- **On Checkout**:
  - If conflicts detected: Shows warning modal
  - If no conflicts: Proceeds to `Checkout.html`
- **Sidebar**: Cart summary

### 5. **Checkout Page** (`Checkout.html`)
- **Purpose**: Confirm order and deliver address
- **Scripts**: `checkout.js`
- **Form Fields**:
  - Delivery address (street, city, postal code)
  - Special instructions (optional)
  - Order summary (read-only)
- **API Call**: `POST /api/orders/create`
- **On Success**:
  - Shows success modal with Order ID
  - Can view order history or continue shopping
- **Features**:
  - Quantity adjustment
  - Item removal
  - Total price calculation

### 6. **Forgot Password** (`ForgotPassword.html`)
- **Purpose**: Reset password in 4 steps
- **Scripts**: `forgotPassword.js`
- **Step 1: Email Verification**
  - Enter email address
  - API Call: `POST /api/auth/request-password-reset`
  - Receives OTP in email
- **Step 2: OTP Verification**
  - Enter 6-digit code from email
  - API Call: `POST /api/auth/verify-reset-code`
  - Can resend code if expired
- **Step 3: New Password**
  - Enter new password (must meet requirements)
  - Confirm password
  - API Call: `POST /api/auth/reset-password`
- **Step 4: Success**
  - Confirmation message
  - Redirect to login page
- **Features**:
  - Real-time password strength validation
  - Password visibility toggle
  - 15-minute code expiry

---

## Admin Journey

### 1. **Admin Login** (`Admin_login.html`)
- **Purpose**: Authenticate admin users
- **Scripts**: `login.js`
- **API Call**: `POST /api/auth/login` (with `login_role: 'admin'`)
- **On Success**:
  - Session created with admin info
  - Redirects to `Admin_dashboard.html`
- **Links**:
  - "Create Admin Account" → `Admin_register.html`
  - "Forgot Password?" → `ForgotPassword.html`

### 2. **Admin Registration** (`Admin_register.html`)
- **Purpose**: Create new admin account
- **Scripts**: `register.js`
- **API Call**: `POST /api/auth/register-admin`
- **Form Fields**:
  - Name, Email, Password, Confirm Password
  - Shop banner image upload (optional)
- **On Success**:
  - Account created
  - Redirects to `Admin_login.html`

### 3. **Admin Dashboard** (`Admin_dashboard.html`)
- **Purpose**: Main admin control center
- **Scripts**: `adminDashboard.js`, `adminNavbar.js`
- **Navigation Navbar**:
  - Inventory Management
  - Search Inventory
  - Drug Conflicts
  - Dashboard (home)
  - Logout
- **Features** (depends on implementation):
  - Overview statistics
  - Recent orders
  - Quick actions
- **Navbar**: Included via `adminNavbar.html` partial

### 4. **Inventory Management** (`Admin_inventory.html`)
- **Purpose**: Add, edit, delete medicines
- **Scripts**: `adminInventory.js`, `adminNavbar.js`
- **Features**:
  - List all medicines with details
  - Add new medicine
  - Edit medicine info
  - Delete medicine
  - Update stock levels
  - Mark as restricted (requires prescription)
- **Form Fields** (for add/edit):
  - Generic name
  - Brand name
  - Strength
  - Dosage form
  - Manufacturer
  - Batch number
  - Expiry date
  - Quantity
  - Price
  - Description

### 5. **Inventory Search** (`Admin_search.html`)
- **Purpose**: Search and filter medicines
- **Scripts**: `adminSearch.js`, `adminNavbar.js`
- **Features**:
  - Search by generic or brand name
  - Filter by expiry date
  - Filter by stock status
  - View medicine details
  - Quick edit access

### 6. **Drug Conflicts Manager** (`Admin_conflicts.html`)
- **Purpose**: Manage drug interaction rules
- **Scripts**: `adminConflicts.js`, `adminNavbar.js`
- **Features**:
  - View all conflict rules
  - Add new conflict rule
  - Set conflict severity (mild, moderate, severe)
  - View affected medicines
  - Delete conflict rules
- **Conflict Levels**:
  - **Mild**: Caution recommended
  - **Moderate**: Avoid combination
  - **Severe**: Blocks checkout

---

## API Endpoints

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Login user/admin |
| POST | `/api/auth/logout` | Logout user/admin |
| GET | `/api/auth/status` | Check authentication status |
| POST | `/api/auth/register-user` | Register new user |
| POST | `/api/auth/register-admin` | Register new admin |
| POST | `/api/auth/request-password-reset` | Request password reset (sends email) |
| POST | `/api/auth/verify-reset-code` | Verify OTP code |
| POST | `/api/auth/reset-password` | Set new password |

### Medicines
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/medicines` | List all medicines (with pagination) |
| GET | `/api/medicines/:id` | Get single medicine details |
| POST | `/api/medicines/search` | Search medicines |

### Cart
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/cart/add` | Add item to cart |
| POST | `/api/cart/remove` | Remove item from cart |
| GET | `/api/cart/view` | View cart contents |
| POST | `/api/cart/check-conflicts` | **⭐ Check for drug interactions** |

### Orders
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/orders/create` | Place new order |
| GET | `/api/orders/history` | Get user's orders |
| GET | `/api/orders/:id` | Get order details |

### Admin
| Method | Endpoint | Purpose |
|--------|----------|---------|
| (To be implemented) | `/api/admin/*` | Admin-specific operations |

---

## Email Setup Instructions

### ⚠️ IMPORTANT: Fix Email Configuration

The password reset feature requires proper email configuration. Follow these steps:

### Step 1: Enable Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already done)
3. Go back to **Security** > **App Passwords**
4. Select **Mail** and **Windows Computer**
5. Google will generate a **16-character password**
6. Copy the password (remove spaces)

### Step 2: Update `.env` File

Edit `c:\Users\Tanzil\Downloads\WebProject\.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=medivaultwebprogramming@gmail.com
EMAIL_PASSWORD=<PASTE_16_CHAR_PASSWORD_HERE>
```

Replace `<PASTE_16_CHAR_PASSWORD_HERE>` with the actual password from Gmail.

### Step 3: Restart Server

```bash
npm start
```

Watch for the message:
- ✅ **✅ Email Transporter Ready**: Setup successful
- ❌ **Email Transporter Error**: Configuration failed

### Alternative Email Services

If using a different email provider:

```env
# SendGrid
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=<SENDGRID_API_KEY>

# Mailgun
EMAIL_SERVICE=mailgun
EMAIL_USER=<MAILGUN_EMAIL>
EMAIL_PASSWORD=<MAILGUN_PASSWORD>
```

---

## Session Management

- **Duration**: 24 hours
- **Storage**: Server-side sessions
- **Logout**: Destroys session and clears credentials
- **Authentication Check**: All protected routes verify session existence

---

## Database Tables Used

### Users Table
- Stores user accounts
- Password reset fields: `reset_code`, `reset_code_expiry`, `reset_token`

### Admins Table
- Stores admin accounts
- Same password reset fields as Users

### Medicines Table
- Medicine catalog
- Fields: generic_name, brand_name, strength, dosage_form, price, quantity, is_restricted

### DrugConflicts Table
- Maps conflicting medicine pairs
- Fields: medicine_id_1, medicine_id_2, conflict_level, description, recommendation

### Orders Table
- User orders
- Linked to user via user_id
- Status tracking

### OrderItems Table
- Individual items in orders
- Links to medicines

### PrescriptionReviews Table
- For restricted medicines
- Admin review workflow

---

## Troubleshooting

### Email Not Sending?
1. Check `.env` file has correct EMAIL_PASSWORD (16-char App Password)
2. Check Gmail account security settings
3. Check server console for error messages (✅ or ❌ indicator)
4. Look for detailed error in reset code field (as fallback)

### Login Not Working?
1. Verify email and password are correct
2. Check user/admin exists in database
3. Check session cookie settings in browser
4. Look for error message on login page

### Drug Conflict Not Detected?
1. Verify conflict rule exists in database
2. Ensure both medicines have correct IDs
3. Check cart has both conflicting medicines
4. Clear browser cache

### Cart Issues?
1. Verify JavaScript console for errors
2. Check localStorage availability
3. Verify user is logged in (check session)

---

## Code Quality Improvements Made

1. ✅ **Simplified Scripts**: Added comments, clear function names, modular structure
2. ✅ **Better Error Handling**: Email transporter verification, detailed error messages
3. ✅ **Security**: Password reset tokens, OTP codes, email verification
4. ✅ **UX**: Clear navigation, visual feedback, loading states
5. ✅ **Documentation**: This guide explains all flows and connections

---

