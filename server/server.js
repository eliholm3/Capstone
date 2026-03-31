require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./db');
const app = require('./app');

// Serve React frontend
app.use(express.static(path.join(__dirname, '..', 'web', 'dist')));
app.get('*path', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connected.');
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
