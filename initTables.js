// initTables.js
require('dotenv').config();
const pool = require('./utils/db.js');

async function createTables() {
  try {
    // Drop tables first to avoid conflicts
    await pool.query(`DROP TABLE IF EXISTS password_resets;`);
    await pool.query(`DROP TABLE IF EXISTS products;`);
    await pool.query(`DROP TABLE IF EXISTS vendors CASCADE;`);

    // Vendors table
    await pool.query(`
      CREATE TABLE vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        store_name VARCHAR(255) UNIQUE NOT NULL,
        whatsapp VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Products table
    await pool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(12,2) NOT NULL,
        image TEXT,
        vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Password resets table
    await pool.query(`
      CREATE TABLE password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    console.log('✅ Tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    process.exit(1);
  }
}

createTables();