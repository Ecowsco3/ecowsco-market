// index.js (CommonJS, Replit-ready, Email.js version)

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pool = require('./utils/db.js');
const crypto = require('crypto');
const path = require('path');
const emailjs = require('@emailjs/nodejs');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// ---------- Helper: send emails via Email.js ----------
async function sendEmail(to, subject, message) {
  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        to_email: to,
        subject,
        message,
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );
  } catch (err) {
    console.error('Email.js error:', err);
  }
}

// ---------- Helper: sanitize store name ----------
function sanitizeStoreName(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
}

// ---------- Home ----------
app.get('/', (req, res) => res.render('index'));

// ---------- Store Name AJAX ----------
app.get('/check-store', async (req, res) => {
  const rawName = req.query.store_name || '';
  const store_name = sanitizeStoreName(rawName);
  const result = await pool.query('SELECT * FROM vendors WHERE store_name=$1', [store_name]);
  res.json({ available: result.rows.length === 0 });
});

// ---------- Register ----------
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
  const { name, email, password, store_name, whatsapp, description } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const sanitizedStore = sanitizeStoreName(store_name);

  try {
    await pool.query(
      `INSERT INTO vendors(name,email,password,store_name,whatsapp,description)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [name, email, hashed, sanitizedStore, whatsapp || null, description || null]
    );
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('Error: Email or store name may already exist.');
  }
});

// ---------- Login ----------
app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM vendors WHERE email=$1', [email]);
  const user = result.rows[0];
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.vendor = user;
    res.redirect('/dashboard');
  } else {
    res.send('Invalid credentials');
  }
});

// ---------- Dashboard ----------
app.get('/dashboard', async (req, res) => {
  if (!req.session.vendor) return res.redirect('/login');
  const products = await pool.query('SELECT * FROM products WHERE vendor_id=$1', [req.session.vendor.id]);
  res.render('dashboard', { vendor: req.session.vendor, products: products.rows });
});

// ---------- Add Product ----------
app.get('/add-product', (req, res) => {
  if (!req.session.vendor) return res.redirect('/login');
  res.render('add_product');
});
app.post('/add-product', async (req, res) => {
  if (!req.session.vendor) return res.redirect('/login');
  const { name, price, image_url, description } = req.body;
  try {
    await pool.query(
      `INSERT INTO products(name,price,image,vendor_id,description)
       VALUES($1,$2,$3,$4,$5)`,
      [name, price, image_url, req.session.vendor.id, description]
    );
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Error adding product');
  }
});

// ---------- Store Page ----------
app.get('/store/:store_name', async (req, res) => {
  const sanitizedStore = sanitizeStoreName(req.params.store_name);
  const result = await pool.query('SELECT * FROM vendors WHERE store_name=$1', [sanitizedStore]);
  const vendor = result.rows[0];
  if (!vendor) return 'Store not found';
  const products = await pool.query('SELECT * FROM products WHERE vendor_id=$1', [vendor.id]);
  res.render('store', { vendor, products: products.rows });
});

// ---------- Password Reset Request ----------
app.get('/reset-request', (req, res) => res.render('reset_request'));
app.post('/reset-request', async (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour
  try {
    await pool.query('INSERT INTO password_resets(email,token,expires_at) VALUES($1,$2,$3)', [
      email,
      token,
      expires,
    ]);
    const link = `https://${req.headers.host}/reset-password/${token}`;
    await sendEmail(email, 'Ecowsco Password Reset', `<p>Click <a href="${link}">here</a> to reset your password.</p>`);
    res.send('Reset link sent! Check your email.');
  } catch (err) {
    console.error(err);
    res.send('Error sending reset link.');
  }
});

// ---------- Reset Password ----------
app.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const result = await pool.query('SELECT * FROM password_resets WHERE token=$1 AND expires_at>$2', [token, new Date()]);
  if (result.rows.length === 0) return 'Invalid or expired token';
  res.render('reset_form', { token });
});
app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const reset = await pool.query('SELECT email FROM password_resets WHERE token=$1', [token]);
    if (reset.rows.length === 0) return 'Invalid token';
    await pool.query('UPDATE vendors SET password=$1 WHERE email=$2', [hashed, reset.rows[0].email]);
    await pool.query('DELETE FROM password_resets WHERE token=$1', [token]);
    res.send('Password reset successful! You can now login.');
  } catch (err) {
    console.error(err);
    res.send('Error resetting password.');
  }
});

// ---------- Logout ----------
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ---------- Admin Dashboard ----------
app.get('/admin', async (req, res) => {
  if (!req.session.admin) return res.render('admin', { admin: false });
  const stores = await pool.query('SELECT * FROM vendors ORDER BY id DESC');
  const products = await pool.query('SELECT * FROM products');
  const totalStores = stores.rows.length;
  const totalProducts = products.rows.length;
  res.render('admin', {
    admin: true,
    stores: stores.rows,
    products: products.rows,
    totalStores,
    totalProducts,
  });
});
app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.admin = true;
    res.redirect('/admin');
  } else res.send('Invalid admin credentials');
});
app.post('/admin/delete-store/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE vendor_id=$1', [id]);
    await pool.query('DELETE FROM vendors WHERE id=$1', [id]);
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.send('Error deleting store');
  }
});

// ---------- Start Server ----------
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));