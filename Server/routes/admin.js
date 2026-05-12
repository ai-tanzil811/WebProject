const express = require('express');
const pool = require('../config/database');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function normalizeConflictPair(medicineId1, medicineId2) {
  const first = Number.parseInt(medicineId1, 10);
  const second = Number.parseInt(medicineId2, 10);

  if (Number.isNaN(first) || Number.isNaN(second) || first === second) {
    return null;
  }

  return first < second ? [first, second] : [second, first];
}

router.get('/conflicts/options', requireAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [medicines] = await connection.query(
        'SELECT medicine_id, generic_name, brand_name, strength, dosage_form, is_restricted FROM Medicines ORDER BY generic_name ASC, brand_name ASC'
      );

      res.json({
        success: true,
        conflictLevels: ['mild', 'moderate', 'severe'],
        medicines
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching conflict options:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conflict options' });
  }
});

router.get('/conflicts', requireAdmin, async (req, res) => {
  try {
    const { severity, medicineId, search } = req.query;
    const connection = await pool.getConnection();

    try {
      let query = `
        SELECT
          dc.conflict_id,
          dc.conflict_level,
          dc.description,
          dc.recommendation,
          dc.created_at,
          m1.medicine_id AS medicine_id_1,
          m1.generic_name AS medicine_1_name,
          m1.brand_name AS medicine_1_brand,
          m1.strength AS medicine_1_strength,
          m2.medicine_id AS medicine_id_2,
          m2.generic_name AS medicine_2_name,
          m2.brand_name AS medicine_2_brand,
          m2.strength AS medicine_2_strength
        FROM DrugConflicts dc
        JOIN Medicines m1 ON dc.medicine_id_1 = m1.medicine_id
        JOIN Medicines m2 ON dc.medicine_id_2 = m2.medicine_id
        WHERE 1=1
      `;
      const params = [];

      if (severity) {
        query += ' AND dc.conflict_level = ?';
        params.push(severity);
      }

      if (medicineId) {
        query += ' AND (dc.medicine_id_1 = ? OR dc.medicine_id_2 = ?)';
        params.push(medicineId, medicineId);
      }

      if (search) {
        query += ' AND (m1.generic_name LIKE ? OR m1.brand_name LIKE ? OR m2.generic_name LIKE ? OR m2.brand_name LIKE ? OR dc.description LIKE ? OR dc.recommendation LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term, term, term);
      }

      query += ' ORDER BY dc.created_at DESC';

      const [conflicts] = await connection.query(query, params);

      const [counts] = await connection.query(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN conflict_level = 'mild' THEN 1 ELSE 0 END) AS mild,
          SUM(CASE WHEN conflict_level = 'moderate' THEN 1 ELSE 0 END) AS moderate,
          SUM(CASE WHEN conflict_level = 'severe' THEN 1 ELSE 0 END) AS severe
        FROM DrugConflicts`
      );

      res.json({
        success: true,
        conflicts,
        summary: counts[0]
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conflicts' });
  }
});

router.post('/conflicts', requireAdmin, async (req, res) => {
  try {
    const { medicineId1, medicineId2, conflictLevel = 'moderate', description = '', recommendation = '' } = req.body;
    const pair = normalizeConflictPair(medicineId1, medicineId2);

    if (!pair) {
      return res.status(400).json({ success: false, message: 'Two different medicine IDs are required' });
    }

    const allowedLevels = new Set(['mild', 'moderate', 'severe']);
    if (!allowedLevels.has(conflictLevel)) {
      return res.status(400).json({ success: false, message: 'Invalid conflict level' });
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO DrugConflicts (medicine_id_1, medicine_id_2, conflict_level, description, recommendation)
         VALUES (?, ?, ?, ?, ?)` ,
        [pair[0], pair[1], conflictLevel, description.trim() || null, recommendation.trim() || null]
      );

      const [rows] = await connection.query(
        `SELECT dc.*, m1.generic_name AS medicine_1_name, m1.brand_name AS medicine_1_brand,
                m1.strength AS medicine_1_strength, m2.generic_name AS medicine_2_name,
                m2.brand_name AS medicine_2_brand, m2.strength AS medicine_2_strength
         FROM DrugConflicts dc
         JOIN Medicines m1 ON dc.medicine_id_1 = m1.medicine_id
         JOIN Medicines m2 ON dc.medicine_id_2 = m2.medicine_id
         WHERE dc.conflict_id = ?`,
        [result.insertId]
      );

      res.status(201).json({ success: true, message: 'Conflict added successfully', conflict: rows[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding conflict:', error);
    res.status(500).json({ success: false, message: 'Failed to add conflict' });
  }
});

router.put('/conflicts/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { medicineId1, medicineId2, conflictLevel = 'moderate', description = '', recommendation = '' } = req.body;
    const pair = normalizeConflictPair(medicineId1, medicineId2);

    if (!pair) {
      return res.status(400).json({ success: false, message: 'Two different medicine IDs are required' });
    }

    const allowedLevels = new Set(['mild', 'moderate', 'severe']);
    if (!allowedLevels.has(conflictLevel)) {
      return res.status(400).json({ success: false, message: 'Invalid conflict level' });
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `UPDATE DrugConflicts
         SET medicine_id_1 = ?, medicine_id_2 = ?, conflict_level = ?, description = ?, recommendation = ?
         WHERE conflict_id = ?`,
        [pair[0], pair[1], conflictLevel, description.trim() || null, recommendation.trim() || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Conflict not found' });
      }

      const [rows] = await connection.query(
        `SELECT dc.*, m1.generic_name AS medicine_1_name, m1.brand_name AS medicine_1_brand,
                m1.strength AS medicine_1_strength, m2.generic_name AS medicine_2_name,
                m2.brand_name AS medicine_2_brand, m2.strength AS medicine_2_strength
         FROM DrugConflicts dc
         JOIN Medicines m1 ON dc.medicine_id_1 = m1.medicine_id
         JOIN Medicines m2 ON dc.medicine_id_2 = m2.medicine_id
         WHERE dc.conflict_id = ?`,
        [id]
      );

      res.json({ success: true, message: 'Conflict updated successfully', conflict: rows[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating conflict:', error);
    res.status(500).json({ success: false, message: 'Failed to update conflict' });
  }
});

router.delete('/conflicts/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query('DELETE FROM DrugConflicts WHERE conflict_id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Conflict not found' });
      }

      res.json({ success: true, message: 'Conflict deleted successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting conflict:', error);
    res.status(500).json({ success: false, message: 'Failed to delete conflict' });
  }
});

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
