const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

const SALT_ROUNDS = 10;

// POST /api/user/create
router.post('/', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, is_admin, created_at)
       VALUES ($1, $2, false, NOW())
       RETURNING user_id, username, is_admin, created_at`,
      [username, password_hash]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, username: user.username, is_admin: user.is_admin, created_at: user.created_at });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
