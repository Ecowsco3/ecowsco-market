// utils/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Neon connection string
  ssl: {
    rejectUnauthorized: false, // Neon requires this
  },
});

module.exports = pool;