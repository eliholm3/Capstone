require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

let sslConfig = false;
if (process.env.DB_SSL !== 'false') {
  sslConfig = {
    rejectUnauthorized: false,
    ca: fs.readFileSync('./certs/global-bundle.pem').toString(),
  };
}

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
