# MediVault Page Navigation Map

## ✅ All Pages Connected Correctly

### Entry Point
- **URL**: `http://localhost:3000/` or `http://localhost:3000/pages/LandingPage.html`
- **File**: `FrontEnd/pages/LandingPage.html`
- **Navigation Links**:
  - ➜ User Login: `/pages/User_login.html`
  - ➜ Admin Login: `/pages/Admin_login.html`
  - ➜ User Register: `/pages/User_register.html`
  - ➜ Admin Register: `/pages/Admin_register.html`

---

## User Flow

### 1️⃣ User Login
- **URL**: `/pages/User_login.html`
- **Script**: `FrontEnd/script/login.js`
- **API Endpoint**: `POST /api/auth/login`
- **Navigation**:
  - ➜ Forgot Password: `/pages/ForgotPassword.html`
  - ➜ Register: `/pages/User_register.html`
  - ➜ Back to Home: `/`
- **On Success**: Redirects to `/pages/Shopping.html`
- **On Failure**: Shows error message, stays on login page

### 2️⃣ User Registration
- **URL**: `/pages/User_register.html`
- **Script**: `FrontEnd/script/register.js`
- **API Endpoint**: `POST /api/auth/register-user`
- **Navigation**:
  - ➜ Already have account: `/pages/User_login.html`
  - ➜ Back to Home: `/`
- **On Success**: Redirects to `/pages/User_login.html` after 2 seconds

### 3️⃣ Password Reset
- **URL**: `/pages/ForgotPassword.html`
- **Script**: `FrontEnd/script/forgotPassword.js`
- **Steps**:
  - Step 1: Enter email → `POST /api/auth/request-password-reset`
  - Step 2: Enter OTP → `POST /api/auth/verify-reset-code`
  - Step 3: New password → `POST /api/auth/reset-password`
  - Step 4: Success
- **Navigation**:
  - ➜ Back to Login: `/pages/User_login.html` (button in step 4)
  - ➜ Back to Home: `/`

### 4️⃣ Shopping Page
- **URL**: `/pages/Shopping.html`
- **Script**: `FrontEnd/script/shopping.js`
- **API Endpoints**:
  - `GET /api/medicines` - Load medicines
  - `POST /api/cart/add` - Add to cart
  - `POST /api/cart/remove` - Remove from cart
  - `POST /api/cart/check-conflicts` - Check drug interactions
- **Actions**:
  - Browse medicines
  - Search by name
  - Filter by strength
  - Add to cart
  - View cart
  - Proceed to checkout (if no conflicts)
- **Navigation**:
  - ➜ Checkout: `/pages/Checkout.html`
  - ➜ Logout: Back to `/pages/User_login.html`

### 5️⃣ Checkout Page
- **URL**: `/pages/Checkout.html`
- **Script**: `FrontEnd/script/checkout.js`
- **API Endpoint**: `POST /api/orders/create`
- **Form Fields**:
  - Delivery address
  - City
  - Postal code
  - Special instructions
- **On Success**: Shows order confirmation with Order ID
- **Navigation**:
  - ➜ Continue Shopping: `/pages/Shopping.html`
  - ➜ View Orders: (depends on implementation)
  - ➜ Logout: `/pages/User_login.html`

---

## Admin Flow

### 1️⃣ Admin Login
- **URL**: `/pages/Admin_login.html`
- **Script**: `FrontEnd/script/login.js`
- **API Endpoint**: `POST /api/auth/login` (with `login_role: 'admin'`)
- **Navigation**:
  - ➜ Forgot Password: `/pages/ForgotPassword.html`
  - ➜ Create Account: `/pages/Admin_register.html`
  - ➜ Back to Home: `/`
- **On Success**: Redirects to `/pages/Admin_dashboard.html`

### 2️⃣ Admin Registration
- **URL**: `/pages/Admin_register.html`
- **Script**: `FrontEnd/script/register.js`
- **API Endpoint**: `POST /api/auth/register-admin`
- **Navigation**:
  - ➜ Already have account: `/pages/Admin_login.html`
  - ➜ Back to Home: `/`
- **On Success**: Redirects to `/pages/Admin_login.html`

### 3️⃣ Admin Dashboard
- **URL**: `/pages/Admin_dashboard.html`
- **Script**: `FrontEnd/script/adminDashboard.js`, `FrontEnd/script/adminNavbar.js`
- **Navbar Links**:
  - ➜ Dashboard: `/pages/Admin_dashboard.html`
  - ➜ Inventory: `/pages/Admin_inventory.html`
  - ➜ Search: `/pages/Admin_search.html`
  - ➜ Conflicts: `/pages/Admin_conflicts.html`
  - ➜ Logout: `/pages/Admin_login.html`

### 4️⃣ Inventory Management
- **URL**: `/pages/Admin_inventory.html`
- **Script**: `FrontEnd/script/adminInventory.js`, `FrontEnd/script/adminNavbar.js`
- **Features**:
  - List all medicines
  - Add new medicine
  - Edit medicine
  - Delete medicine
  - Update stock levels
- **Navbar**: Same as dashboard

### 5️⃣ Inventory Search
- **URL**: `/pages/Admin_search.html`
- **Script**: `FrontEnd/script/adminSearch.js`, `FrontEnd/script/adminNavbar.js`
- **Features**:
  - Search medicines
  - Filter by various criteria
  - View details
- **Navbar**: Same as dashboard

### 6️⃣ Drug Conflicts Manager
- **URL**: `/pages/Admin_conflicts.html`
- **Script**: `FrontEnd/script/adminConflicts.js`, `FrontEnd/script/adminNavbar.js`
- **Features**:
  - View conflicts
  - Add new conflict
  - Set conflict level
  - Delete conflicts
- **Navbar**: Same as dashboard

---

## URL Pattern Summary

```
Entry Point:
  / ➜ LandingPage.html

User Pages:
  /pages/User_login.html
  /pages/User_register.html
  /pages/ForgotPassword.html (both)
  /pages/Shopping.html
  /pages/Checkout.html

Admin Pages:
  /pages/Admin_login.html
  /pages/Admin_register.html
  /pages/Admin_dashboard.html
  /pages/Admin_inventory.html
  /pages/Admin_search.html
  /pages/Admin_conflicts.html

All CSS Files:
  /Styles/*.css

All JavaScript Files:
  /script/*.js
```

---

## Testing Checklist

- [ ] Access `/` → Should show LandingPage
- [ ] Click User Login → Should go to `/pages/User_login.html`
- [ ] Click Admin Login → Should go to `/pages/Admin_login.html`
- [ ] Login as user → Should redirect to `/pages/Shopping.html`
- [ ] Login as admin → Should redirect to `/pages/Admin_dashboard.html`
- [ ] Click "Forgot Password" → Should go to `/pages/ForgotPassword.html`
- [ ] Complete password reset → Should redirect to login page
- [ ] Register new user → Should go to login page
- [ ] Register new admin → Should go to admin login page
- [ ] Admin navbar → Should link to all admin pages correctly

---

## Fixed Issues

✅ **Login Redirect Fixed**
- Was: `/user/Shopping.html` (WRONG)
- Now: `/pages/Shopping.html` (CORRECT)

✅ **Admin Dashboard Redirect Fixed**
- Was: `/admin/Admin_dashboard` (WRONG)
- Now: `/pages/Admin_dashboard.html` (CORRECT)

✅ **All Page Connections Verified**
- Landing page links verified
- Login/Register links verified
- Forgot password links verified
- Admin navbar links verified

---

## Server Configuration

**Static File Serving**:
```javascript
app.use(express.static(path.join(__dirname, '../FrontEnd')));
```

All files in `FrontEnd/` folder are served as static files:
- `/pages/*` ➜ `FrontEnd/pages/*`
- `/script/*` ➜ `FrontEnd/script/*`
- `/Styles/*` ➜ `FrontEnd/Styles/*`

---

