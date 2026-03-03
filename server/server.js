require('dotenv').config();
const express = require('express');
const pool = require('./db');

const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const datasetsRouter = require('./routes/datasets');
const imagesRouter = require('./routes/images');

const app = express();
app.use(express.json());

// Auth routes
app.use('/api/user/register', registerRouter);
app.use('/api/user/login', loginRouter);

// Dataset routes
app.use('/api/datasets', datasetsRouter);

// Image routes (nested under datasets)
app.use('/api/datasets', imagesRouter);

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
