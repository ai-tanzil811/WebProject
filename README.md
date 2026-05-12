# MediVault - Setup Instructions

## Prerequisites
- Node.js (v14+)
- MySQL Server running on localhost
- Database name: `medivault`
- MySQL Username: `root`
- MySQL Password: `12345678`

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Database:**
   - Create database in MySQL:
   ```sql
   CREATE DATABASE medivault;
   ```
   - Run the database schema:
   ```bash
   mysql -u root -p12345678 medivault < Server/main_DB.sql
   ```

3. **Add Test Data:**
   - First, generate a hashed password:
   ```bash
   node Server/utils/hashPassword.js
   ```
   - Copy the hashed password and insert test users:
   ```sql
   -- Example: Insert a test user
   INSERT INTO Users (name, email, password_hash, nid, age) 
   VALUES ('John Doe', 'user@example.com', 'YOUR_HASHED_PASSWORD', 'NID123456', 30);

   -- Example: Insert a test admin
   INSERT INTO Admins (name, email, password_hash) 
   VALUES ('Admin User', 'admin@example.com', 'YOUR_HASHED_PASSWORD');
   ```

## Running the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:3000` by default, and will automatically try the next free port if `3000` is already in use.

## Features
- User and Admin login pages
- Session management with express-session
- Password hashing with bcryptjs
- MySQL database integration
- RESTful API endpoints

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/auth/status` - Check authentication status

## Project Structure
```
WebProject/
├── Server/
│   ├── server.js              # Main server file
│   ├── config/
│   │   └── database.js        # Database connection pool
│   ├── routes/
│   │   └── auth.js            # Authentication routes
│   ├── utils/
│   │   └── hashPassword.js    # Password hashing utility
│   └── main_DB.sql            # Database schema
├── FrontEnd/
│   ├── pages/
│   │   ├── LandingPage.html
│   │   ├── User_login.html
│   │   └── Admin_login.html
│   ├── script/
│   │   └── login.js           # Login form handler
│   └── Styles/
│       ├── landingPage.css
│       └── userLogin.css
└── package.json
```

## Security Notes
- Change the session secret in `Server/server.js` for production
- Always use HTTPS in production
- Keep your MySQL password secure
- Hash passwords before storing in database
