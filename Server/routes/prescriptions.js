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

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Admin access required' });
  }
  next();
}

router.post('/upload', requireLogin, upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Prescription file is required' });
    }

    const user_id = req.session.user.id;
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uploadsDir = path.join(__dirname, '..', '..', 'FrontEnd', 'uploads', 'prescriptions');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${safeName}`;
    const destPath = path.join(uploadsDir, filename);
    fs.writeFileSync(destPath, req.file.buffer);
    const prescriptionPath = `/uploads/prescriptions/${filename}`;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO PrescriptionUploads (user_id, file_path, file_name, status)
         VALUES (?, ?, ?, ?)`,
        [user_id, prescriptionPath, req.file.originalname, 'pending']
      );

      await createUserNotification(connection, {
        userId: user_id,
        title: 'Prescription submitted',
        message: 'Your prescription upload is waiting for admin approval.',
        notificationType: 'info',
        referenceType: 'prescription-upload',
        referenceId: result.insertId
      });

      res.status(201).json({
        success: true,
        message: 'Prescription uploaded successfully and is pending review',
        upload_id: result.insertId,
        file_path: prescriptionPath
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error uploading prescription:', error);
    res.status(500).json({ success: false, message: 'Failed to upload prescription' });
  }
});

router.get('/my', requireLogin, async (req, res) => {
  try {
    const user_id = req.session.user.id;
    const connection = await pool.getConnection();
    try {
      const [uploads] = await connection.query(
        `SELECT upload_id, file_path, file_name, status, review_notes, admin_id, created_at, updated_at
         FROM PrescriptionUploads
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [user_id]
      );

      res.json({ success: true, upload: uploads[0] || null });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching user prescription:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prescription status' });
  }
});

router.get('/pending', requireAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [uploads] = await connection.query(
        `SELECT pu.upload_id, pu.user_id, pu.file_path, pu.file_name, pu.status, pu.review_notes,
                pu.created_at, pu.updated_at,
                u.name AS user_name, u.email AS user_email
         FROM PrescriptionUploads pu
         JOIN Users u ON pu.user_id = u.user_id
         WHERE pu.status = 'pending'
         ORDER BY pu.created_at DESC`
      );

      res.json({ success: true, uploads });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching pending prescriptions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending prescriptions' });
  }
});

router.put('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.session.user.id;
    const review_notes = req.body.review_notes || 'Approved by admin';

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `UPDATE PrescriptionUploads
         SET status = 'approved', admin_id = ?, review_notes = ?
         WHERE upload_id = ? AND status = 'pending'`,
        [admin_id, review_notes, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Pending prescription not found or already processed' });
      }

      const [uploadRows] = await connection.query(
        'SELECT user_id, file_name FROM PrescriptionUploads WHERE upload_id = ?',
        [id]
      );

      if (uploadRows[0]) {
        await createUserNotification(connection, {
          userId: uploadRows[0].user_id,
          title: 'Prescription approved',
          message: `Your prescription ${uploadRows[0].file_name} has been approved by the admin.`,
          notificationType: 'success',
          referenceType: 'prescription-upload',
          referenceId: Number.parseInt(id, 10)
        });
      }

      res.json({ success: true, message: 'Prescription approved' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error approving prescription:', error);
    res.status(500).json({ success: false, message: 'Failed to approve prescription' });
  }
});

router.put('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.session.user.id;
    const review_notes = req.body.review_notes || 'Rejected by admin';

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `UPDATE PrescriptionUploads
         SET status = 'rejected', admin_id = ?, review_notes = ?
         WHERE upload_id = ? AND status = 'pending'`,
        [admin_id, review_notes, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Pending prescription not found or already processed' });
      }

      const [uploadRows] = await connection.query(
        'SELECT user_id, file_name FROM PrescriptionUploads WHERE upload_id = ?',
        [id]
      );

      if (uploadRows[0]) {
        await createUserNotification(connection, {
          userId: uploadRows[0].user_id,
          title: 'Prescription rejected',
          message: `Your prescription ${uploadRows[0].file_name} was rejected by the admin. Review notes: ${review_notes}`,
          notificationType: 'error',
          referenceType: 'prescription-upload',
          referenceId: Number.parseInt(id, 10)
        });
      }

      res.json({ success: true, message: 'Prescription rejected' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error rejecting prescription:', error);
    res.status(500).json({ success: false, message: 'Failed to reject prescription' });
  }
});

module.exports = router;
