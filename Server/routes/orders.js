const express = require('express');
const pool = require('../config/database');

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
}

router.post('/create', requireLogin, async (req, res) => {
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
      await connection.beginTransaction();

      const total_amount = req.session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const [orderResult] = await connection.query(
        'INSERT INTO Orders (user_id, total_amount, status_id, notes) VALUES (?, ?, ?, ?)',
        [user_id, total_amount, 1, notes || null]
      );

      const order_id = orderResult.insertId;

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

        if (medicine[0] && medicine[0].is_restricted) {
          await connection.query(
            'INSERT INTO PrescriptionReviews (order_id, admin_id, review_status) VALUES (?, ?, ?)',
            [order_id, null, 'pending']
          );
        }
      }

      await connection.commit();

      req.session.cart = [];

      res.json({
        success: true,
        message: 'Order placed successfully',
        order_id: order_id
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
