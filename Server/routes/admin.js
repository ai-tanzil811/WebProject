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
        'SELECT COUNT(*) AS pending_reviews FROM PrescriptionUploads WHERE status = ?',
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

      const [reservedRows] = await connection.query(
        `SELECT
          m.medicine_id,
          m.generic_name,
          m.brand_name,
          m.strength,
          SUM(oi.quantity) AS reserved_quantity,
          COUNT(DISTINCT o.order_id) AS order_count,
          GROUP_CONCAT(DISTINCT os.status_name SEPARATOR ', ') AS order_statuses,
          MAX(o.created_at) AS last_reserved_at
        FROM OrderItems oi
        JOIN Medicines m ON oi.medicine_id = m.medicine_id
        JOIN Orders o ON oi.order_id = o.order_id
        JOIN OrderStatuses os ON o.status_id = os.status_id
        WHERE o.status_id IN (
          SELECT status_id FROM OrderStatuses WHERE status_name IN ('pending', 'confirmed', 'processing')
        )
        GROUP BY m.medicine_id
        ORDER BY last_reserved_at DESC, reserved_quantity DESC
        LIMIT 50`
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
        activity: activityRows,
        reservedMedicines: reservedRows
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
});

router.get('/export/compliance-report', requireAdmin, async (req, res) => {
  try {
    const lowStockThreshold = Number.parseInt(req.query.lowStockThreshold, 10) || 20;
    const expiringDays = Number.parseInt(req.query.expiringDays, 10) || 30;
    const lastDays = Number.parseInt(req.query.lastDays, 10) || 7;
    const admin_id = req.session.user.id;

    const connection = await pool.getConnection();
    try {
      // Get summary statistics
      const [summaryRows] = await connection.query(
        `SELECT
          COUNT(*) AS total_medicines,
          SUM(CASE WHEN quantity <= ? THEN 1 ELSE 0 END) AS low_stock,
          SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock,
          SUM(CASE WHEN expiry_date IS NOT NULL
            AND expiry_date >= CURDATE()
            AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
          THEN 1 ELSE 0 END) AS expiring_soon,
          SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURDATE() THEN 1 ELSE 0 END) AS expired,
          SUM(CASE WHEN is_restricted = TRUE THEN 1 ELSE 0 END) AS restricted_medicines,
          SUM(price * quantity) AS total_inventory_value
        FROM Medicines`,
        [lowStockThreshold, expiringDays]
      );

      // Get today's orders
      const [todaysOrders] = await connection.query(
        `SELECT
          o.order_id,
          o.order_date,
          o.total_amount,
          u.name AS customer_name,
          os.status_name,
          GROUP_CONCAT(DISTINCT CONCAT(m.generic_name, ' - ', oi.quantity, 'x') SEPARATOR ', ') AS medicines_ordered,
          SUM(oi.quantity) AS total_quantity
        FROM Orders o
        JOIN Users u ON o.user_id = u.user_id
        JOIN OrderStatuses os ON o.status_id = os.status_id
        JOIN OrderItems oi ON o.order_id = oi.order_id
        JOIN Medicines m ON oi.medicine_id = m.medicine_id
        WHERE DATE(o.order_date) = CURDATE()
        GROUP BY o.order_id
        ORDER BY o.order_date DESC`
      );

      // Get orders from last N days
      const [lastDaysOrders] = await connection.query(
        `SELECT
          DATE(o.order_date) AS order_date,
          COUNT(*) AS orders_count,
          SUM(oi.quantity) AS total_quantity,
          SUM(o.total_amount) AS total_value
        FROM Orders o
        JOIN OrderItems oi ON o.order_id = oi.order_id
        WHERE DATE(o.order_date) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(o.order_date)
        ORDER BY order_date DESC`,
        [lastDays]
      );

      // Get reserved medicines (pending/processing orders)
      const [reservedMedicines] = await connection.query(
        `SELECT
          m.medicine_id,
          m.generic_name,
          m.brand_name,
          m.strength,
          SUM(oi.quantity) AS reserved_quantity,
          COUNT(DISTINCT o.order_id) AS order_count,
          GROUP_CONCAT(DISTINCT os.status_name SEPARATOR ', ') AS order_statuses
        FROM OrderItems oi
        JOIN Medicines m ON oi.medicine_id = m.medicine_id
        JOIN Orders o ON oi.order_id = o.order_id
        JOIN OrderStatuses os ON o.status_id = os.status_id
        WHERE o.status_id IN (SELECT status_id FROM OrderStatuses WHERE status_name IN ('pending', 'confirmed', 'processing'))
        GROUP BY m.medicine_id
        ORDER BY reserved_quantity DESC`
      );

      const [pendingOrderCountRows] = await connection.query(
        `SELECT COUNT(DISTINCT o.order_id) AS pending_orders
         FROM Orders o
         JOIN OrderStatuses os ON o.status_id = os.status_id
         WHERE os.status_name IN ('pending', 'confirmed', 'processing')`
      );

      // Calculate totals
      const todaysTotal = todaysOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const todaysQuantity = todaysOrders.reduce((sum, order) => sum + (order.total_quantity || 0), 0);
      const reservedQuantity = reservedMedicines.reduce((sum, med) => sum + (med.reserved_quantity || 0), 0);
      const pendingOrdersCount = pendingOrderCountRows[0]?.pending_orders || 0;

      // Prepare report data
      const reportData = {
        inventory_summary: {
          total_medicines: summaryRows[0].total_medicines,
          total_inventory_value: parseFloat(summaryRows[0].total_inventory_value || 0).toFixed(2),
          low_stock_items: summaryRows[0].low_stock || 0,
          out_of_stock_items: summaryRows[0].out_of_stock || 0,
          expired_medicines: summaryRows[0].expired || 0,
          expiring_soon: summaryRows[0].expiring_soon || 0,
          restricted_medicines: summaryRows[0].restricted_medicines || 0
        },
        todays_orders: {
          count: todaysOrders.length,
          total_quantity: todaysQuantity,
          total_value: parseFloat(todaysTotal).toFixed(2),
          orders: todaysOrders.map(order => ({
            order_id: order.order_id,
            customer_name: order.customer_name,
            order_date: new Date(order.order_date).toLocaleString(),
            status: order.status_name,
            medicines: order.medicines_ordered,
            quantity: order.total_quantity,
            amount: parseFloat(order.total_amount).toFixed(2)
          }))
        },
        last_days_orders: {
          days: lastDays,
          data: lastDaysOrders.map(day => ({
            date: day.order_date,
            orders_count: day.orders_count,
            total_quantity: day.total_quantity,
            total_value: parseFloat(day.total_value).toFixed(2)
          }))
        },
        reserved_medicines: {
          total_quantity: reservedQuantity,
          pending_orders: pendingOrdersCount,
          medicines: reservedMedicines.map(med => ({
            medicine_id: med.medicine_id,
            generic_name: med.generic_name,
            brand_name: med.brand_name,
            strength: med.strength || 'N/A',
            reserved_quantity: med.reserved_quantity,
            order_count: med.order_count,
            order_statuses: med.order_statuses
          }))
        },
        generated_at: new Date().toLocaleString(),
        parameters: {
          low_stock_threshold: lowStockThreshold,
          expiring_days: expiringDays,
          last_days: lastDays
        }
      };

      // Store report in database
      const reportJson = JSON.stringify(reportData);
      const [reportResult] = await connection.query(
        `INSERT INTO ComplianceReports
         (admin_id, report_date, total_medicines, total_inventory_value, low_stock_items, 
          out_of_stock_items, expired_medicines, expiring_soon, restricted_medicines,
          todays_orders_count, todays_orders_quantity, todays_orders_value, 
          reserved_medicines_quantity, pending_orders_count, report_data)
         VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          admin_id,
          summaryRows[0].total_medicines,
          summaryRows[0].total_inventory_value || 0,
          summaryRows[0].low_stock || 0,
          summaryRows[0].out_of_stock || 0,
          summaryRows[0].expired || 0,
          summaryRows[0].expiring_soon || 0,
          summaryRows[0].restricted_medicines || 0,
          todaysOrders.length,
          todaysQuantity,
          todaysTotal,
          reservedQuantity,
          pendingOrdersCount,
          reportJson
        ]
      );

      res.json({
        success: true,
        message: 'Compliance report generated and stored successfully',
        report_id: reportResult.insertId,
        data: reportData
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error exporting compliance report:', error);
    res.status(500).json({ success: false, message: 'Failed to export compliance report' });
  }
});

router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();
    try {
      const [reports] = await connection.query(
        `SELECT
          report_id,
          report_date,
          total_medicines,
          total_inventory_value,
          low_stock_items,
          out_of_stock_items,
          expired_medicines,
          expiring_soon,
          restricted_medicines,
          todays_orders_count,
          todays_orders_quantity,
          todays_orders_value,
          reserved_medicines_quantity,
          pending_orders_count,
          created_at
        FROM ComplianceReports
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [parseInt(limit), offset]
      );

      const [countResult] = await connection.query(
        'SELECT COUNT(*) as total FROM ComplianceReports'
      );

      res.json({
        success: true,
        reports,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch compliance reports' });
  }
});

router.get('/reports/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    try {
      const [reports] = await connection.query(
        `SELECT
          report_id,
          report_date,
          report_data,
          created_at
        FROM ComplianceReports
        WHERE report_id = ?`,
        [id]
      );

      if (reports.length === 0) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      const report = reports[0];
      report.data = JSON.parse(report.report_data);

      res.json({
        success: true,
        report
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching compliance report:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch compliance report' });
  }
});


module.exports = router;
