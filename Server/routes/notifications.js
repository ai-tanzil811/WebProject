const express = require('express');
const pool = require('../config/database');

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
}

router.get('/', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const connection = await pool.getConnection();
    try {
      const [notifications] = await connection.query(
        `SELECT notification_id, title, message, notification_type, reference_type, reference_id,
                is_read, created_at, updated_at
         FROM UserNotifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );

      const [countRows] = await connection.query(
        'SELECT COUNT(*) AS unread_count FROM UserNotifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );

      res.json({ success: true, notifications, unreadCount: countRows[0].unread_count });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT COUNT(*) AS unread_count FROM UserNotifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );

      res.json({ success: true, unreadCount: rows[0].unread_count });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

router.patch('/mark-all-read', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE UserNotifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );

      res.json({ success: true, message: 'Notifications marked as read' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

module.exports = router;