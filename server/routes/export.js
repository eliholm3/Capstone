const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/export/images?dataset_id=123 — Export approved images as CSV
async function exportImages(req, res) {
  const { dataset_id } = req.query;

  if (!dataset_id) {
    return res.status(400).json({ error: 'dataset_id query parameter is required.' });
  }

  try {
    // Verify dataset belongs to the user
    const dsCheck = await pool.query(
      'SELECT dataset_id FROM datasets WHERE dataset_id = $1 AND user_id = $2',
      [dataset_id, req.user.user_id]
    );

    if (dsCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const result = await pool.query(
      "SELECT image_id, url, title, license FROM images WHERE dataset_id = $1 AND status = 'approved'",
      [dataset_id]
    );

    // Build CSV
    const header = 'image_id,url,title,license';
    const rows = result.rows.map(r =>
      `${r.image_id},${r.url},${r.title || ''},${r.license || ''}`
    );
    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=dataset_${dataset_id}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Export images error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// POST /api/export/login — login for export panel
async function exportLogin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT user_id, username, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, username: user.username });
  } catch (err) {
    console.error('Export login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

router.get('/images', auth, exportImages);
router.post('/login', exportLogin);

module.exports = router;
module.exports.exportImages = exportImages;
module.exports.exportLogin = exportLogin;
