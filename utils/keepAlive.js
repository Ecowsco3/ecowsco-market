// utils/keepAlive.js
const pool = require('./db');

setInterval(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('💓 Database keep-alive ping successful');
  } catch (err) {
    console.error('⚠️ Keep-alive ping failed:', err.message);
  }
}, 5 * 60 * 1000); // every 5 minutes