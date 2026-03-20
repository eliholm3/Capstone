require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const sslConfig = process.env.DB_SSL === 'false' ? false : {
  rejectUnauthorized: false,
  ca: fs.readFileSync('./certs/global-bundle.pem').toString(),
};

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: sslConfig,
  min: 1,
});

module.exports = pool;
