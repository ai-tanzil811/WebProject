const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const medicinesRoutes = require('./routes/medicines');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
require('dotenv').config();

const app = express();
const DEFAULT_PORT = Number.parseInt(process.env.PORT, 10) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

app.use(express.static(path.join(__dirname, '../FrontEnd')));

// Redirect legacy page paths to the new /pages/ structure
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  let redirectPath = null;

  if (req.path.startsWith('/user/') || req.path.startsWith('/admin/')) {
    redirectPath = req.path.replace(/^\/(user|admin)\//, '/pages/');
    if (!path.extname(redirectPath)) {
      redirectPath += '.html';
    }
  } else if (req.path.startsWith('/pages/') && !path.extname(req.path)) {
    redirectPath = `${req.path}.html`;
  }

  if (redirectPath) {
    return res.redirect(301, redirectPath);
  }

  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../FrontEnd/pages/LandingPage.html'));
});

function startServer(port, retriesLeft = 10) {
  const server = app.listen(port, () => {
    console.log(`MediVault server running on http://localhost:${port}`);
    console.log(`Frontend available at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && retriesLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use, trying ${nextPort}...`);
      setTimeout(() => startServer(nextPort, retriesLeft - 1), 0);
      return;
    }

    console.error(`Failed to start server on port ${port}:`, error.message);
    process.exit(1);
  });
}

startServer(DEFAULT_PORT);
