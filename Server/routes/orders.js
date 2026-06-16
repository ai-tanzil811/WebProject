const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { createUserNotification } = require('../utils/notifications');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
}

router.post('/create', requireLogin, upload.single('prescription'), async (req, res) => {
  try {
    const { deliveryAddress, notes } = req.body;
    const user_id = req.session.user.id;

    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: 'Delivery address required' });
    }

    if (!req.session.cart || req.session.cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const connection = await pool.getConnection();
    try {
      const restrictedMedicineIds = req.session.cart.map(item => item.medicine_id);
      let hasRestrictedItems = false;

      if (restrictedMedicineIds.length > 0) {
        const placeholders = restrictedMedicineIds.map(() => '?').join(',');
        const [restrictedRows] = await connection.query(
          `SELECT medicine_id FROM Medicines WHERE medicine_id IN (${placeholders}) AND is_restricted = TRUE`,
          restrictedMedicineIds
        );
        hasRestrictedItems = restrictedRows.length > 0;
      }

      if (hasRestrictedItems && !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Prescription upload is required to place an order containing restricted medicines.'
        });
      }

      let prescriptionPath = null;
      if (req.file) {
        const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const uploadsDir = path.join(__dirname, '..', '..', 'FrontEnd', 'uploads', 'prescriptions');
        fs.mkdirSync(uploadsDir, { recursive: true });
        const filename = `${Date.now()}-${safeName}`;
        const destPath = path.join(uploadsDir, filename);
        fs.writeFileSync(destPath, req.file.buffer);
        prescriptionPath = `/uploads/prescriptions/${filename}`;
      }

      await connection.beginTransaction();

      const total_amount = req.session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const [orderResult] = await connection.query(
        'INSERT INTO Orders (user_id, total_amount, status_id, notes) VALUES (?, ?, ?, ?)',
        [user_id, total_amount, 1, notes || null]
      );

      const order_id = orderResult.insertId;
      let insertedPrescriptionUpload = false;

      for (const item of req.session.cart) {
        const subtotal = item.price * item.quantity;
        await connection.query(
          'INSERT INTO OrderItems (order_id, medicine_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [order_id, item.medicine_id, item.quantity, item.price, subtotal]
        );

        const [medicine] = await connection.query(
          'SELECT is_restricted FROM Medicines WHERE medicine_id = ?',
          [item.medicine_id]
        );

        if (medicine[0] && medicine[0].is_restricted && prescriptionPath && !insertedPrescriptionUpload) {
          await connection.query(
            `INSERT INTO PrescriptionUploads (user_id, file_path, file_name, status, review_notes)
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, prescriptionPath, req.file.originalname, 'pending', 'Prescription submitted during checkout']
          );

          await createUserNotification(connection, {
            userId: user_id,
            title: 'Prescription submitted',
            message: 'Your prescription has been sent to the admin team for approval.',
            notificationType: 'info',
            referenceType: 'prescription-upload',
            referenceId: order_id
          });

          insertedPrescriptionUpload = true;
        }
      }

      await connection.commit();

      req.session.cart = [];

      req.session.save((sessionError) => {
        if (sessionError) {
          console.error('Error saving checkout session:', sessionError);
          return res.status(500).json({ success: false, message: 'Order placed, but session update failed' });
        }

        res.json({
          success: true,
          message: 'Order placed successfully',
          order_id: order_id
        });
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

router.get('/history', requireLogin, async (req, res) => {
  try {
    const user_id = req.session.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();
    try {
      const [orders] = await connection.query(
        'SELECT o.order_id, o.order_date, o.total_amount, os.status_name, o.created_at FROM Orders o JOIN OrderStatuses os ON o.status_id = os.status_id WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT ? OFFSET ?',
        [user_id, parseInt(limit), offset]
      );

      const [countResult] = await connection.query(
        'SELECT COUNT(*) as total FROM Orders WHERE user_id = ?',
        [user_id]
      );

      res.json({
        success: true,
        orders,
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
    console.error('Error fetching order history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order history' });
  }
});

router.get('/:id', requireLogin, async (req, res) => {
  try {
    const order_id = req.params.id;
    const user_id = req.session.user.id;

    const connection = await pool.getConnection();
    try {
      const [orders] = await connection.query(
        'SELECT o.*, os.status_name FROM Orders o JOIN OrderStatuses os ON o.status_id = os.status_id WHERE o.order_id = ? AND o.user_id = ?',
        [order_id, user_id]
      );

      if (orders.length === 0) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const [items] = await connection.query(
        'SELECT oi.*, m.generic_name, m.brand_name, m.strength FROM OrderItems oi JOIN Medicines m ON oi.medicine_id = m.medicine_id WHERE oi.order_id = ?',
        [order_id]
      );

      res.json({
        success: true,
        order: orders[0],
        items: items
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

module.exports = router;
