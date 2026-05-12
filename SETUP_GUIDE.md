# MediVault - Complete Setup & Troubleshooting Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   cd c:\Users\Tanzil\Downloads\WebProject
   npm install
   ```

2. **Setup Database**
   ```bash
   mysql -u root -p < Server/database/medivault_schema.sql
   mysql -u root -p < Server/database/sample_data.sql
   ```

3. **Configure Environment** (see [Email Setup](#-email-setup-instructions))
   - Edit `.env` file with your Gmail App Password

4. **Start Server**
   ```bash
   npm start
   ```
   - Server runs on `http://localhost:3000`
   - Look for email verification message

---

## 📧 Email Setup Instructions

### Why Email Setup is Critical
- Password reset feature depends on email service
- Without email, users cannot recover forgotten passwords
- Default Gmail simple password won't work

### Step-by-Step Gmail Setup

#### 1. Go to Google Account Security
   - Visit: https://myaccount.google.com/security
   - Log in with `medivaultwebprogramming@gmail.com`

#### 2. Enable 2-Step Verification
   - Find "2-Step Verification" section
   - Click "Enable" and follow Google's verification process

#### 3. Create Gmail App Password
   - Go to **Security** > **App Passwords**
   - Select **Mail** from first dropdown
   - Select **Windows Computer** from second dropdown
   - Google generates a **16-character password**
   - **Copy this password** (remove any spaces)

#### 4. Update `.env` File
   - Open: `c:\Users\Tanzil\Downloads\WebProject\.env`
   - Replace this line:
   ```env
   EMAIL_PASSWORD=<YOUR_16_CHAR_APP_PASSWORD_HERE>
   ```
   - Example (use your actual password):
   ```env
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

#### 5. Verify Configuration
   - Save `.env` file
   - Restart server: `npm start`
   - Look for this message:
   ```
   ✅ Email Transporter Ready: medivaultwebprogramming@gmail.com
   ```

---

## 📱 Testing the Application

### Test User Account
```
Email: user@example.com
Password: Password123
```

### Test Admin Account
```
Email: admin@example.com
Password: Password123
```

*(Create new accounts if these don't exist)*

### Test Scenario: Password Reset

1. Go to Login Page → "Forgot Password?"
2. Enter email: `user@example.com`
3. You should receive email within 30 seconds
4. Enter the 6-digit code from email
5. Create new password (must have uppercase, lowercase, number, 8+ chars)
6. Password should reset successfully

---

## 🔍 Common Issues & Solutions

### Issue 1: "Email service not configured"

**Problem**: Password reset fails with message about email configuration

**Solutions**:
- Check `.env` file exists and has EMAIL_PASSWORD set
- Verify it's a 16-character **App Password**, not regular Gmail password
- Ensure 2-Step Verification is enabled on Gmail account
- Restart server after updating `.env`

**Debug**:
```bash
# Check what email server sees
npm start
# Look for this in console:
# ✅ Email Transporter Ready: medivaultwebprogramming@gmail.com
# OR
# ❌ Email Transporter Error: [error message]
```

---

### Issue 2: "Email sending failed" Error

**Problem**: Email configuration works but sending fails

**Solutions**:
- Verify Gmail account isn't locked
- Check "Less secure app access" isn't blocking
- Try generating a new App Password
- Ensure internet connection is stable

**Check Gmail Security**:
1. Go to https://myaccount.google.com/device-activity
2. Look for any "suspicious activity" blocks
3. Approve if asked to verify

---

### Issue 3: OTP Code Not Received

**Problem**: Password reset email doesn't arrive

**Checklist**:
- ✓ Email configured correctly (.env)
- ✓ Server shows "Email Transporter Ready"
- ✓ Check spam/junk folder
- ✓ Try resend button
- ✓ Verify email address is correct
- ✓ Check Gmail account active (not suspended)

**Get Fallback Code**:
- If email fails, console shows: `Reset code: 123456`
- You can check browser dev tools (F12 > Network tab)

---

### Issue 4: Login Not Working

**Problem**: Can't log in with correct credentials

**Solutions**:
1. Check user account exists in database
   ```bash
   mysql -u root -p medivault
   SELECT * FROM Users WHERE email = 'your-email@example.com';
   ```

2. Verify password is hashed (starts with `$2`)
   - If not, account might be corrupted
   - Delete and re-register

3. Check browser console for specific error
   - Press F12 > Console tab
   - Look for error message

4. Clear browser cache
   - Ctrl+Shift+Delete
   - Select "All time"
   - Clear

---

### Issue 5: Drug Conflicts Not Showing

**Problem**: No warning when adding conflicting medicines

**Check**:
1. Verify conflicts exist in database
   ```bash
   mysql -u root -p medivault
   SELECT * FROM DrugConflicts;
   ```

2. Verify medicine IDs match
   - The two medicine_id values should reference existing medicines

3. Clear browser cache and reload

4. Check browser console for JavaScript errors (F12)

---

### Issue 6: Database Connection Failed

**Problem**: "Error: connect ECONNREFUSED 127.0.0.1:3306"

**Solutions**:
1. Verify MySQL is running
   ```bash
   # Windows: Check Services
   # Mac/Linux: brew services list
   ```

2. Check database credentials in `.env`
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=12345678
   DB_NAME=medivault
   ```

3. Verify database exists
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   ```

4. If database missing, recreate it
   ```bash
   mysql -u root -p < Server/database/medivault_schema.sql
   mysql -u root -p < Server/database/sample_data.sql
   ```

---

## 🛠️ Development Workflow

### File Structure to Remember

```
Server/
├── server.js              ← Main server file (run this)
├── config/
│   └── database.js        ← Database connection
├── routes/
│   ├── auth.js            ← Login, register, password reset
│   ├── medicines.js       ← Medicine catalog
│   ├── cart.js            ← Shopping cart & conflicts
│   ├── orders.js          ← Order management
│   └── admin.js           ← Admin operations
└── database/
    ├── medivault_schema.sql  ← Database structure
    └── sample_data.sql       ← Test data

FrontEnd/
├── pages/                 ← HTML pages
├── script/                ← JavaScript handlers
├── Styles/                ← CSS files
└── partials/              ← Reusable components
```

### Making Changes

#### Add New Feature to Backend
1. Create/update route file in `Server/routes/`
2. Import in `Server/server.js`
3. Test with Postman or curl

#### Update Frontend Form
1. Edit HTML in `FrontEnd/pages/`
2. Edit JavaScript in `FrontEnd/script/`
3. Test in browser (F12 console for errors)

#### Modify Database Schema
1. Edit `Server/database/medivault_schema.sql`
2. Run: `mysql -u root -p < Server/database/medivault_schema.sql`
3. Re-populate sample data if needed

---

## 🔐 Security Best Practices Implemented

✅ **Password Security**
- Passwords hashed with bcryptjs (10 rounds)
- Never stored in plain text
- Minimum 8 characters required

✅ **Email Verification**
- OTP codes generated randomly (100000-999999)
- Codes expire after 15 minutes
- Reset token separate from code

✅ **Session Management**
- Server-side sessions (not stored in browser)
- Expires after 24 hours
- HttpOnly cookies (can't access from JavaScript)

✅ **Database Security**
- Prepared statements prevent SQL injection
- Foreign key constraints maintain data integrity
- Indexes on frequently queried columns

✅ **Input Validation**
- Email format validation
- Password strength requirements
- File upload size limits (5MB)

---

## 📚 Database Schema Quick Reference

### Users Table
```sql
CREATE TABLE Users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),      -- bcrypt hash
  reset_code VARCHAR(6),           -- OTP for password reset
  reset_code_expiry DATETIME,      -- When code expires
  reset_token VARCHAR(255),        -- Secure token
  name VARCHAR(255),
  nid VARCHAR(50) UNIQUE,
  age INT,
  photo_image_path VARCHAR(500),
  created_at TIMESTAMP
);
```

### Medicines Table
```sql
CREATE TABLE Medicines (
  medicine_id INT PRIMARY KEY AUTO_INCREMENT,
  generic_name VARCHAR(255),
  brand_name VARCHAR(255),
  strength VARCHAR(100),
  dosage_form VARCHAR(100),
  manufacturer VARCHAR(255),
  price DECIMAL(10,2),
  quantity INT,
  is_restricted BOOLEAN,           -- Needs prescription
  expiry_date DATE,
  created_at TIMESTAMP
);
```

### DrugConflicts Table
```sql
CREATE TABLE DrugConflicts (
  conflict_id INT PRIMARY KEY AUTO_INCREMENT,
  medicine_id_1 INT,               -- First medicine
  medicine_id_2 INT,               -- Second medicine
  conflict_level ENUM('mild', 'moderate', 'severe'),
  description TEXT,                -- What's the issue?
  recommendation TEXT,             -- What to do?
  FOREIGN KEY (medicine_id_1) REFERENCES Medicines,
  FOREIGN KEY (medicine_id_2) REFERENCES Medicines
);
```

### Orders Table
```sql
CREATE TABLE Orders (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,                     -- Which user
  order_date TIMESTAMP,
  total_amount DECIMAL(12,2),
  status_id INT,                   -- pending/confirmed/shipped
  delivery_date DATETIME,
  FOREIGN KEY (user_id) REFERENCES Users,
  FOREIGN KEY (status_id) REFERENCES OrderStatuses
);
```

---

## 🧪 Testing Checklist

- [ ] **Authentication**
  - [ ] User registration works
  - [ ] User login works
  - [ ] Admin registration works
  - [ ] Admin login works
  - [ ] Logout clears session

- [ ] **Password Reset**
  - [ ] Email sends successfully
  - [ ] OTP code is verified
  - [ ] Password can be changed
  - [ ] New password works for login
  - [ ] Code expires after 15 minutes
  - [ ] Resend button works

- [ ] **Shopping**
  - [ ] Medicines display
  - [ ] Search filters work
  - [ ] Add to cart works
  - [ ] Remove from cart works
  - [ ] Cart total calculates correctly

- [ ] **Drug Conflicts**
  - [ ] Conflicts detected correctly
  - [ ] Warning modal shows
  - [ ] Cannot checkout with conflicts
  - [ ] Can remove item and retry

- [ ] **Orders**
  - [ ] Order creates successfully
  - [ ] Order ID generated
  - [ ] Order saved in database
  - [ ] Order history visible

---

## 📞 Support & Debugging

### Enable Debug Mode
Edit `Server/server.js` and uncomment debug logs:
```javascript
console.log('DEBUG: [function name]', data);
```

### Check Browser Console
- Press **F12** to open Developer Tools
- Click **Console** tab
- Look for red errors or yellow warnings
- Network tab shows API requests/responses

### Check Server Console
- Look at terminal where you ran `npm start`
- Database queries show as they execute
- Email sending logs appear here
- Errors print with stack traces

### Database Debugging
```bash
# Open MySQL console
mysql -u root -p medivault

# Check user exists
SELECT email, password_hash FROM Users WHERE email = 'test@example.com';

# Check reset code
SELECT email, reset_code, reset_code_expiry FROM Users WHERE email = 'test@example.com';

# Check medicines
SELECT medicine_id, generic_name, quantity FROM Medicines LIMIT 5;

# Check conflicts
SELECT * FROM DrugConflicts;
```

---

## 🎓 Code Quality Improvements

### What Was Improved

1. **Simplified JavaScript**
   - Added comprehensive comments
   - Clear function names
   - Modular code structure
   - Easier to understand and maintain

2. **Better Error Handling**
   - Email transporter validation on startup
   - Detailed error messages for debugging
   - Graceful fallback when email fails
   - Clear console logging

3. **Security Enhancements**
   - Password reset verification
   - OTP code expiry
   - Reset token security
   - Input validation

4. **User Experience**
   - Clear navigation paths
   - Visual feedback (loading states)
   - Helpful error messages
   - Responsive design

5. **Documentation**
   - Navigation guide (NAVIGATION_GUIDE.md)
   - This setup guide
   - Inline code comments
   - API endpoint reference

---

## ✅ Success Indicators

### When Everything Works

```
✅ Server starts without errors
✅ "Email Transporter Ready" message appears
✅ Can create user account
✅ Can log in
✅ Can reset password (email arrives)
✅ Can browse medicines
✅ Can add items to cart
✅ Drug conflicts detected
✅ Can place order
```

### Common Success Message
```
MediVault server running on http://localhost:3000
Frontend available at http://localhost:3000
✅ Email Transporter Ready: medivaultwebprogramming@gmail.com
```

---

## 🔄 Next Steps for Full Implementation

1. **Admin Dashboard Features**
   - Order management interface
   - User management
   - Sales analytics

2. **Payment Integration**
   - Stripe or PayPal integration
   - Payment verification

3. **Advanced Search**
   - Full-text search
   - Saved searches
   - Search history

4. **Prescription Management**
   - Upload prescription images
   - Admin verification workflow
   - Automated approval

5. **Notifications**
   - Email order confirmations
   - SMS alerts
   - Push notifications

6. **Mobile App**
   - React Native or Flutter app
   - Same API endpoints
   - Offline mode

---

