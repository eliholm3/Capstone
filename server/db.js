require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('./certs/global-bundle.pem').toString(),
  },
});

module.exports = pool;
