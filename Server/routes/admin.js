const express = require('express');
const pool = require('../config/database');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Admin access required' });
  }
  next();
}

router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const lowStockThreshold = Number.parseInt(req.query.lowStockThreshold, 10) || 20;
    const expiringDays = Number.parseInt(req.query.expiringDays, 10) || 30;

    const connection = await pool.getConnection();
    try {
      const [summaryRows] = await connection.query(
        `SELECT
          COUNT(*) AS total_medicines,
          SUM(CASE WHEN quantity <= ? THEN 1 ELSE 0 END) AS low_stock,
          SUM(CASE WHEN expiry_date IS NOT NULL
            AND expiry_date >= CURDATE()
            AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
          THEN 1 ELSE 0 END) AS expiring_soon
        FROM Medicines`,
        [lowStockThreshold, expiringDays]
      );

      const [pendingRows] = await connection.query(
        'SELECT COUNT(*) AS pending_reviews FROM PrescriptionReviews WHERE review_status = ?',
        ['pending']
      );

      const [activityRows] = await connection.query(
        `SELECT al.log_id, al.action, al.entity_type, al.created_at,
          COALESCE(a.name, u.name) AS actor_name
        FROM ActivityLogs al
        LEFT JOIN Admins a ON al.admin_id = a.admin_id
        LEFT JOIN Users u ON al.user_id = u.user_id
        ORDER BY al.created_at DESC
        LIMIT 6`
      );

      res.json({
        success: true,
        stats: {
          totalMedicines: summaryRows[0].total_medicines,
          lowStockAlerts: summaryRows[0].low_stock,
          expiringSoon: summaryRows[0].expiring_soon,
          pendingReviews: pendingRows[0].pending_reviews,
          lowStockThreshold,
          expiringDays
        },
        activity: activityRows
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
