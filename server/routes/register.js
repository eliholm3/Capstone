const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

const SALT_ROUNDS = 10;

// POST /api/user/register
async function registerHandler(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already taken.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING user_id, username, email, created_at`,
      [username, email, password_hash]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`User created: ${user.username} (id: ${user.user_id})`);
    res.status(201).json({ token, username: user.username, email: user.email, created_at: user.created_at });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

router.post('/', registerHandler);

module.exports = router;
module.exports.registerHandler = registerHandler;
