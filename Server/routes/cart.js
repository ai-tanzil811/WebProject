const express = require('express');
const pool = require('../config/database');

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  next();
}

router.post('/add', requireLogin, async (req, res) => {
  try {
    const { medicine_id, quantity } = req.body;

    if (!medicine_id || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid medicine_id or quantity' });
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const connection = await pool.getConnection();
    try {
      const [medicines] = await connection.query(
        'SELECT medicine_id, price, quantity as stock FROM Medicines WHERE medicine_id = ?',
        [medicine_id]
      );

      if (medicines.length === 0) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }

      if (medicines[0].stock < quantity) {
        return res.status(400).json({ success: false, message: 'Not enough stock available' });
      }

      const existing = req.session.cart.find(item => item.medicine_id === parseInt(medicine_id));

      if (existing) {
        existing.quantity += parseInt(quantity);
      } else {
        req.session.cart.push({
          medicine_id: parseInt(medicine_id),
          quantity: parseInt(quantity),
          price: medicines[0].price
        });
      }

      res.json({
        success: true,
        message: 'Item added to cart',
        cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0)
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

router.post('/remove', requireLogin, (req, res) => {
  try {
    const { medicine_id } = req.body;

    if (!medicine_id) {
      return res.status(400).json({ success: false, message: 'medicine_id required' });
    }

    if (!req.session.cart) {
      return res.json({ success: true, message: 'Item removed from cart', cartCount: 0 });
    }

    req.session.cart = req.session.cart.filter(item => item.medicine_id !== parseInt(medicine_id));

    res.json({
      success: true,
      message: 'Item removed from cart',
      cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from cart' });
  }
});

router.get('/view', requireLogin, async (req, res) => {
  try {
    if (!req.session.cart || req.session.cart.length === 0) {
      return res.json({ success: true, cart: [], total: 0 });
    }

    const connection = await pool.getConnection();
    try {
      const medicineIds = req.session.cart.map(item => item.medicine_id);
      const placeholders = medicineIds.map(() => '?').join(',');

      const [medicines] = await connection.query(
        `SELECT medicine_id, generic_name, brand_name, strength, dosage_form, price, is_restricted FROM Medicines WHERE medicine_id IN (${placeholders})`,
        medicineIds
      );

      const medicineMap = Object.fromEntries(medicines.map(m => [m.medicine_id, m]));

      const cart = req.session.cart.map(item => ({
        ...medicineMap[item.medicine_id],
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }));

      const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

      res.json({ success: true, cart, total });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error viewing cart:', error);
    res.status(500).json({ success: false, message: 'Failed to view cart' });
  }
});

router.post('/check-conflicts', requireLogin, async (req, res) => {
  try {
    if (!req.session.cart || req.session.cart.length === 0) {
      return res.json({ success: true, conflicts: [] });
    }

    const user_id = req.session.user.id;
    const cartMedicineIds = req.session.cart.map(item => item.medicine_id);

    const connection = await pool.getConnection();
    try {
      const conflicts = [];

      const [userOrders] = await connection.query(
        'SELECT order_id FROM Orders WHERE user_id = ? AND order_date > NOW() - INTERVAL 7 DAY',
        [user_id]
      );

      const orderIds = userOrders.map(o => o.order_id);
      let userMedicines = new Set();

      if (orderIds.length > 0) {
        const placeholders = orderIds.map(() => '?').join(',');
        const [orderItems] = await connection.query(
          `SELECT DISTINCT medicine_id FROM OrderItems WHERE order_id IN (${placeholders})`,
          orderIds
        );
        userMedicines = new Set(orderItems.map(item => item.medicine_id));
      }

      const allMedicineIds = new Set([...cartMedicineIds, ...userMedicines]);
      const medicineIdArray = Array.from(allMedicineIds);

      if (medicineIdArray.length < 2) {
        return res.json({ success: true, conflicts: [] });
      }

      for (let i = 0; i < cartMedicineIds.length; i++) {
        for (let j = i + 1; j < cartMedicineIds.length; j++) {
          const med1 = cartMedicineIds[i];
          const med2 = cartMedicineIds[j];

          const [found] = await connection.query(
            'SELECT * FROM DrugConflicts WHERE (medicine_id_1 = ? AND medicine_id_2 = ?) OR (medicine_id_1 = ? AND medicine_id_2 = ?)',
            [med1, med2, med2, med1]
          );

          if (found.length > 0) {
            conflicts.push(found[0]);
          }
        }
      }

      for (const cartMed of cartMedicineIds) {
        for (const userMed of userMedicines) {
          if (cartMed === userMed) continue;

          const [found] = await connection.query(
            'SELECT * FROM DrugConflicts WHERE (medicine_id_1 = ? AND medicine_id_2 = ?) OR (medicine_id_1 = ? AND medicine_id_2 = ?)',
            [cartMed, userMed, userMed, cartMed]
          );

          if (found.length > 0) {
            conflicts.push(found[0]);
          }
        }
      }

      res.json({ success: true, conflicts });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ success: false, message: 'Failed to check conflicts' });
  }
});

module.exports = router;
