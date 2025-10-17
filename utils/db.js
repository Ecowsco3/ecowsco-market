// utils/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, // Needed for Neon
  },
  idleTimeoutMillis: 30000, // Remove idle clients after 30s
  connectionTimeoutMillis: 10000, // Timeout if connection >10s
});

// Handle unexpected disconnections
pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL client error:', err.message);
});

// Test connection immediately
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to Neon PostgreSQL at', res.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

module.exports = pool;