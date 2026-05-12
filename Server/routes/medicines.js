const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, strength, dosageForm } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT medicine_id, generic_name, brand_name, strength, dosage_form, manufacturer, price, quantity, is_restricted FROM Medicines WHERE 1=1';
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
