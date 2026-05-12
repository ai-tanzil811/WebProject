const express = require('express');
const pool = require('../config/database');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function normalizeMedicinePayload(body) {
  const quantity = Number.parseInt(body.quantity, 10);
  const price = body.price === undefined || body.price === '' ? null : Number.parseFloat(body.price);
  const isRestricted = body.isRestricted === true || body.isRestricted === 'true' || body.isRestricted === 1 || body.isRestricted === '1';

  return {
    genericName: (body.genericName || body.generic_name || body.name || '').trim(),
    brandName: (body.brandName || body.brand_name || body.genericName || body.generic_name || body.name || '').trim(),
    strength: (body.strength || '').trim() || null,
    dosageForm: (body.dosageForm || body.dosage_form || '').trim() || null,
    manufacturer: (body.manufacturer || '').trim() || null,
    batchNumber: (body.batchNumber || body.batch_number || '').trim() || null,
    expiryDate: (body.expiryDate || body.expiry_date || '').trim() || null,
    quantity: Number.isNaN(quantity) ? 0 : Math.max(0, quantity),
    price: price === null || Number.isNaN(price) ? null : Math.max(0, price),
    isRestricted,
    description: (body.description || '').trim() || null
  };
}

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, strength, dosageForm } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT
        m.medicine_id,
        m.generic_name,
        m.brand_name,
        m.strength,
        m.dosage_form,
        m.manufacturer,
        m.price,
        m.quantity,
        m.is_restricted,
        m.expiry_date,
        (
          SELECT COUNT(*)
          FROM DrugConflicts dc
          WHERE dc.medicine_id_1 = m.medicine_id OR dc.medicine_id_2 = m.medicine_id
        ) AS conflict_count
      FROM Medicines m WHERE 1=1`;
    const params = [];

    if (search) {
      query += ' AND (generic_name LIKE ? OR brand_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (strength) {
      query += ' AND strength LIKE ?';
      params.push(`%${strength}%`);
    }

    if (dosageForm) {
      query += ' AND dosage_form = ?';
      params.push(dosageForm);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const connection = await pool.getConnection();
    try {
      const [medicines] = await connection.query(query, params);

      const [countResult] = await connection.query(
        'SELECT COUNT(*) as total FROM Medicines WHERE 1=1' +
        (search ? ' AND (generic_name LIKE ? OR brand_name LIKE ?)' : '') +
        (strength ? ' AND strength LIKE ?' : '') +
        (dosageForm ? ' AND dosage_form = ?' : ''),
        params.slice(0, params.length - 2)
      );

      res.json({
        success: true,
        medicines,
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
    console.error('Error fetching medicines:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const medicine = normalizeMedicinePayload(req.body);

    if (!medicine.genericName) {
      return res.status(400).json({ success: false, message: 'Generic name is required' });
    }

    if (!medicine.brandName) {
      return res.status(400).json({ success: false, message: 'Brand name is required' });
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO Medicines
          (generic_name, brand_name, strength, dosage_form, manufacturer, batch_number, expiry_date, quantity, price, is_restricted, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          medicine.genericName,
          medicine.brandName,
          medicine.strength,
          medicine.dosageForm,
          medicine.manufacturer,
          medicine.batchNumber,
          medicine.expiryDate,
          medicine.quantity,
          medicine.price,
          medicine.isRestricted,
          medicine.description
        ]
      );

      const [rows] = await connection.query('SELECT * FROM Medicines WHERE medicine_id = ?', [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Medicine added successfully',
        medicine: rows[0]
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to add medicine' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = normalizeMedicinePayload(req.body);

    if (!medicine.genericName) {
      return res.status(400).json({ success: false, message: 'Generic name is required' });
    }

    if (!medicine.brandName) {
      return res.status(400).json({ success: false, message: 'Brand name is required' });
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `UPDATE Medicines
         SET generic_name = ?, brand_name = ?, strength = ?, dosage_form = ?, manufacturer = ?, batch_number = ?,
             expiry_date = ?, quantity = ?, price = ?, is_restricted = ?, description = ?
         WHERE medicine_id = ?`,
        [
          medicine.genericName,
          medicine.brandName,
          medicine.strength,
          medicine.dosageForm,
          medicine.manufacturer,
          medicine.batchNumber,
          medicine.expiryDate,
          medicine.quantity,
          medicine.price,
          medicine.isRestricted,
          medicine.description,
          id
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }

      const [rows] = await connection.query('SELECT * FROM Medicines WHERE medicine_id = ?', [id]);

      res.json({
        success: true,
        message: 'Medicine updated successfully',
        medicine: rows[0]
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to update medicine' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query('DELETE FROM Medicines WHERE medicine_id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }

      res.json({ success: true, message: 'Medicine deleted successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to delete medicine' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    try {
      const [medicines] = await connection.query(
        'SELECT * FROM Medicines WHERE medicine_id = ?',
        [id]
      );

      if (medicines.length === 0) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }

      res.json({ success: true, medicine: medicines[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medicine' });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const connection = await pool.getConnection();
    try {
      const [medicines] = await connection.query(
        'SELECT medicine_id, generic_name, brand_name, strength, dosage_form, price FROM Medicines WHERE (generic_name LIKE ? OR brand_name LIKE ?) LIMIT ?',
        [`%${query}%`, `%${query}%`, parseInt(limit)]
      );

      res.json({ success: true, medicines });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error searching medicines:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

module.exports = router;
