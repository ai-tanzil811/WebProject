const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/database');
const multer = require('multer');

const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateOTPEmailTemplate(userName, otp) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MediVault Password Reset</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .header-logo {
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
        }
        .header-subtitle {
          color: #dbeafe;
          font-size: 14px;
          font-weight: 500;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .greeting {
          font-size: 18px;
          color: #111827;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .message {
          color: #6b7280;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .otp-box {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #bfdbfe;
          border-radius: 12px;
          padding: 30px;
          margin: 32px 0;
        }
        .otp-label {
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .otp-code {
          font-size: 48px;
          font-weight: 800;
          color: #1d4ed8;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          word-break: break-all;
        }
        .expiry {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin: 24px 0;
          border-radius: 6px;
          text-align: left;
        }
        .expiry-text {
          color: #92400e;
          font-size: 14px;
          font-weight: 500;
        }
        .steps {
          background: #f9fafb;
          padding: 24px;
          border-radius: 12px;
          margin: 32px 0;
          text-align: left;
        }
        .steps-title {
          color: #111827;
          font-weight: 600;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .step {
          display: flex;
          margin-bottom: 12px;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }
        .step-number {
          background: #dbeafe;
          color: #1d4ed8;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          margin-right: 12px;
          flex-shrink: 0;
          font-size: 12px;
        }
        .security-notice {
          background: #f3e8ff;
          border-left: 4px solid #a855f7;
          padding: 16px;
          margin: 24px 0;
          border-radius: 6px;
          font-size: 13px;
          color: #6b21a8;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          color: #6b7280;
          font-size: 12px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 16px 0;
        }
        .footer-link {
          color: #1d4ed8;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
        }
        .footer-link:hover {
          text-decoration: underline;
        }
        .logo-footer {
          color: #111827;
          font-size: 14px;
          font-weight: 700;
          margin-top: 16px;
        }
        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 24px 0;
        }
        @media (max-width: 600px) {
          .content { padding: 30px 20px; }
          .otp-code { font-size: 36px; letter-spacing: 6px; }
          .header { padding: 30px 20px; }
          .footer { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-logo">🔐 MediVault</div>
          <div class="header-subtitle">Password Recovery Center</div>
        </div>

        <!-- Main Content -->
        <div class="content">
          <p class="greeting">Hello ${userName},</p>

          <p class="message">
            We received a request to reset your password. Your secure verification code is below.
            This code will only work for the next 15 minutes.
          </p>

          <!-- OTP Box -->
          <div class="otp-box">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
          </div>

          <!-- Expiry Warning -->
          <div class="expiry">
            <div class="expiry-text">⏱️ This code expires in <strong>15 minutes</strong></div>
          </div>

          <!-- Steps -->
          <div class="steps">
            <div class="steps-title">How to reset your password:</div>
            <div class="step">
              <div class="step-number">1</div>
              <div>Enter the 6-digit code above on the password reset page</div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div>Create a new strong password (min. 8 characters)</div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div>Confirm your new password</div>
            </div>
            <div class="step">
              <div class="step-number">4</div>
              <div>Log in with your new password</div>
            </div>
          </div>

          <!-- Security Notice -->
          <div class="security-notice">
            <strong>🛡️ Security Notice:</strong> If you didn't request this password reset,
            please ignore this email and ensure your account is secure. Never share this code
            with anyone.
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            Questions or need help? Our support team is here to assist you.
          </p>

          <div class="footer-links">
            <a href="https://medivault.example.com/support" class="footer-link">Support</a>
            <a href="https://medivault.example.com/privacy" class="footer-link">Privacy Policy</a>
            <a href="https://medivault.example.com/terms" class="footer-link">Terms</a>
          </div>

          <div class="divider"></div>

          <div class="logo-footer">© 2026 MediVault — Secure Clinical Infrastructure</div>

          <p class="footer-text" style="margin-top: 16px; font-size: 11px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/login', async (req, res) => {
  try {
    const { email, password, login_role } = req.body;

    if (!email || !password || !login_role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required'
      });
    }

    const role = login_role === 'admin' ? 'Admins' : 'Users';
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query(
        `SELECT * FROM ${role} WHERE email = ?`,
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      req.session.user = {
        id: user.admin_id || user.user_id,
        email: user.email,
        name: user.name,
        role: login_role,
      };

      res.json({
        success: true,
        message: 'Login successful',
        redirect: login_role === 'admin' ? '/admin/dashboard.html' : '/user/dashboard.html'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

router.get('/status', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

router.post('/register-user', upload.single('photo'), async (req, res) => {
  try {
    const { name, email, password, nid, age } = req.body;

    if (!name || !email || !password || !nid || !age) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const connection = await pool.getConnection();

    try {
      // Check if email already exists
      const [existingUsers] = await connection.query(
        'SELECT user_id FROM Users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Check if NID already exists
      const [existingNID] = await connection.query(
        'SELECT user_id FROM Users WHERE nid = ?',
        [nid]
      );

      if (existingNID.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'NID already registered'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      let photoPath = null;
      let photoType = null;

      if (req.file) {
        photoPath = `/uploads/users/${Date.now()}-${req.file.originalname}`;
        photoType = req.file.mimetype;
      }

      await connection.query(
        'INSERT INTO Users (name, email, password_hash, nid, age, photo_image_path, photo_image_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, nid, age, photoPath, photoType]
      );

      res.json({
        success: true,
        message: 'User account created successfully'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

router.post('/register-admin', upload.single('shopBanner'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const connection = await pool.getConnection();

    try {
      // Check if email already exists
      const [existingAdmins] = await connection.query(
        'SELECT admin_id FROM Admins WHERE email = ?',
        [email]
      );

      if (existingAdmins.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered as admin'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      let bannerPath = null;
      let bannerType = null;

      if (req.file) {
        bannerPath = `/uploads/admins/${Date.now()}-${req.file.originalname}`;
        bannerType = req.file.mimetype;
      }

      await connection.query(
        'INSERT INTO Admins (name, email, password_hash, shop_banner_image_path, shop_banner_image_type) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, bannerPath, bannerType]
      );

      res.json({
        success: true,
        message: 'Admin account created successfully'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const connection = await pool.getConnection();

    try {
      // Check if user exists
      const [users] = await connection.query('SELECT user_id, name FROM Users WHERE email = ?', [email]);
      const [admins] = await connection.query('SELECT admin_id, name FROM Admins WHERE email = ?', [email]);

      if (users.length === 0 && admins.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Email not found in system'
        });
      }

      const userType = users.length > 0 ? 'user' : 'admin';
      const resetCode = generateOTP();
      const resetToken = generateResetToken();
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Update reset code in database
      const table = userType === 'user' ? 'Users' : 'Admins';
      const idColumn = userType === 'user' ? 'user_id' : 'admin_id';

      await connection.query(
        `UPDATE ${table} SET reset_code = ?, reset_code_expiry = ?, reset_token = ? WHERE email = ?`,
        [resetCode, expiryTime, resetToken, email]
      );

      // Send email with OTP
      const user = userType === 'user' ? users[0] : admins[0];
      const emailHTML = generateOTPEmailTemplate(user.name, resetCode);

      await transporter.sendMail({
        to: email,
        subject: '🔐 Your MediVault Password Reset Code',
        html: emailHTML
      });

      res.json({
        success: true,
        message: 'Reset code sent to your email',
        resetToken: resetToken,
        userType: userType
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during reset request'
    });
  }
});

router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, resetCode } = req.body;

    if (!email || !resetCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and reset code are required'
      });
    }

    const connection = await pool.getConnection();

    try {
      // Check users table
      const [users] = await connection.query(
        'SELECT * FROM Users WHERE email = ? AND reset_code = ?',
        [email, resetCode]
      );

      if (users.length > 0) {
        const user = users[0];
        if (new Date() > new Date(user.reset_code_expiry)) {
          return res.status(400).json({
            success: false,
            message: 'Reset code has expired. Please request a new one.'
          });
        }

        return res.json({
          success: true,
          message: 'Code verified',
          resetToken: user.reset_token,
          userType: 'user'
        });
      }

      // Check admins table
      const [admins] = await connection.query(
        'SELECT * FROM Admins WHERE email = ? AND reset_code = ?',
        [email, resetCode]
      );

      if (admins.length > 0) {
        const admin = admins[0];
        if (new Date() > new Date(admin.reset_code_expiry)) {
          return res.status(400).json({
            success: false,
            message: 'Reset code has expired. Please request a new one.'
          });
        }

        return res.json({
          success: true,
          message: 'Code verified',
          resetToken: admin.reset_token,
          userType: 'admin'
        });
      }

      res.status(400).json({
        success: false,
        message: 'Invalid reset code'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const connection = await pool.getConnection();

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Try updating user
      const [userResult] = await connection.query(
        'UPDATE Users SET password_hash = ?, reset_code = NULL, reset_code_expiry = NULL, reset_token = NULL WHERE email = ? AND reset_token = ?',
        [hashedPassword, email, resetToken]
      );

      if (userResult.affectedRows > 0) {
        return res.json({
          success: true,
          message: 'Password reset successfully'
        });
      }

      // Try updating admin
      const [adminResult] = await connection.query(
        'UPDATE Admins SET password_hash = ?, reset_code = NULL, reset_code_expiry = NULL, reset_token = NULL WHERE email = ? AND reset_token = ?',
        [hashedPassword, email, resetToken]
      );

      if (adminResult.affectedRows > 0) {
        return res.json({
          success: true,
          message: 'Password reset successfully'
        });
      }

      res.status(400).json({
        success: false,
        message: 'Invalid reset token or email'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

module.exports = router;
