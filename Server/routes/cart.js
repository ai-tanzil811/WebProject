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
    const parsedMedicineId = Number.parseInt(medicine_id, 10);
    const parsedQuantity = Number.parseInt(quantity, 10);

    if (Number.isNaN(parsedMedicineId) || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid medicine_id or quantity' });
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const connection = await pool.getConnection();
    try {
      const [medicines] = await connection.query(
        'SELECT medicine_id, generic_name, brand_name, price, quantity as stock FROM Medicines WHERE medicine_id = ?',
        [parsedMedicineId]
      );

      if (medicines.length === 0) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }

      const existing = req.session.cart.find(item => item.medicine_id === parsedMedicineId);
      const requestedQuantity = existing ? existing.quantity + parsedQuantity : parsedQuantity;

      if (medicines[0].stock < requestedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock available. Current stock: ${medicines[0].stock}`
        });
      }

      if (existing) {
        existing.quantity = requestedQuantity;
        existing.price = Number.parseFloat(medicines[0].price);
      } else {
        req.session.cart.push({
          medicine_id: parsedMedicineId,
          quantity: parsedQuantity,
          price: Number.parseFloat(medicines[0].price)
        });
      }

      res.json({
        success: true,
        message: `${medicines[0].generic_name} added to cart`,
        medicine: {
          medicine_id: medicines[0].medicine_id,
          generic_name: medicines[0].generic_name,
          brand_name: medicines[0].brand_name
        },
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

router.post('/update', requireLogin, async (req, res) => {
  try {
    const { medicine_id, quantity } = req.body;
    const parsedMedicineId = Number.parseInt(medicine_id, 10);
    const parsedQuantity = Number.parseInt(quantity, 10);

    if (Number.isNaN(parsedMedicineId) || Number.isNaN(parsedQuantity)) {
      return res.status(400).json({ success: false, message: 'Valid medicine_id and quantity are required' });
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const itemIndex = req.session.cart.findIndex((item) => item.medicine_id === parsedMedicineId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Medicine not found in cart' });
    }

    if (parsedQuantity <= 0) {
      req.session.cart.splice(itemIndex, 1);
      return res.json({
        success: true,
        message: 'Item removed from cart',
        cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0)
      });
    }

    const connection = await pool.getConnection();
    try {
      const [medicines] = await connection.query(
        'SELECT medicine_id, generic_name, price, quantity AS stock FROM Medicines WHERE medicine_id = ?',
        [parsedMedicineId]
      );

      if (medicines.length === 0) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }

      if (parsedQuantity > medicines[0].stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${medicines[0].stock} units available in stock`
        });
      }

      req.session.cart[itemIndex].quantity = parsedQuantity;
      req.session.cart[itemIndex].price = Number.parseFloat(medicines[0].price);

      res.json({
        success: true,
        message: `${medicines[0].generic_name} quantity updated`,
        cartCount: req.session.cart.reduce((sum, item) => sum + item.quantity, 0),
        itemQuantity: parsedQuantity
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    res.status(500).json({ success: false, message: 'Failed to update cart quantity' });
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
        `SELECT
          m.medicine_id,
          m.generic_name,
          m.brand_name,
          m.strength,
          m.dosage_form,
          m.manufacturer,
          m.price,
          m.quantity,
          m.expiry_date,
          m.is_restricted,
          m.description,
          (
            SELECT COUNT(*)
            FROM DrugConflicts dc
            WHERE dc.medicine_id_1 = m.medicine_id OR dc.medicine_id_2 = m.medicine_id
          ) AS conflict_count
         FROM Medicines m
         WHERE m.medicine_id IN (${placeholders})`,
        medicineIds
      );

      const medicineMap = Object.fromEntries(medicines.map(m => [m.medicine_id, m]));

      const cart = req.session.cart.map(item => ({
        ...medicineMap[item.medicine_id],
        quantity: item.quantity,
        subtotal: Number.parseFloat(medicineMap[item.medicine_id]?.price || 0) * item.quantity
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

      const cartSet = new Set(cartMedicineIds);
      const allMedicineIds = new Set([...cartMedicineIds, ...userMedicines]);
      const medicineIdArray = Array.from(allMedicineIds);

      if (medicineIdArray.length < 2) {
        return res.json({ success: true, conflicts: [] });
      }

      const placeholders = medicineIdArray.map(() => '?').join(',');
      const [foundConflicts] = await connection.query(
        `SELECT
          dc.*,
          m1.generic_name AS medicine_1_name,
          m2.generic_name AS medicine_2_name
         FROM DrugConflicts dc
         JOIN Medicines m1 ON dc.medicine_id_1 = m1.medicine_id
         JOIN Medicines m2 ON dc.medicine_id_2 = m2.medicine_id
         WHERE dc.medicine_id_1 IN (${placeholders})
           AND dc.medicine_id_2 IN (${placeholders})`,
        [...medicineIdArray, ...medicineIdArray]
      );

      foundConflicts.forEach((conflict) => {
        const involvesCart = cartSet.has(conflict.medicine_id_1) || cartSet.has(conflict.medicine_id_2);
        if (involvesCart) {
          conflicts.push(conflict);
        }
      });

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
