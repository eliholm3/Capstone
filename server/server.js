require('dotenv').config();
const { Client } = require('pg');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-2' });

async function main() {
  const password = process.env.DB_PASSWORD;
  

  const client = new Client({
    host: 'general-db.cduma06e2zsa.us-east-2.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password,
    ssl: { rejectUnauthorized: false, ca: require('fs').readFileSync('/certs/global-bundle.pem').toString() }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT version()');
    console.log(res.rows[0].version);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    await client.end();
  }
}
main().catch(console.error);
