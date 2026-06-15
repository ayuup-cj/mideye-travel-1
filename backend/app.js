require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// Absolute path to the frontend/ folder (one level up from backend/)
const FRONTEND = path.join(__dirname, '..', 'frontend');

const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cargoRoutes   = require('./routes/cargoRoutes');
const adminRoutes   = require('./routes/adminRoutes');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// server.js imports this app; CORS is configured here so all /api routes inherit it.
const allowedOrigins = [
  // Local development (unchanged)
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'null', // file:// protocol during local dev

  // Production – Render frontend
  'https://mideye-travel-1.onrender.com',
];

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (Render health checks, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Reject without throwing — avoids 500 responses that lack CORS headers on preflight
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve Static Frontend ────────────────────────────────────────────────────
// frontend/css       → /css/...
// frontend/js        → /js/...
// frontend/images    → /images/...
// frontend/templates → /templates/...
app.use(express.static(FRONTEND));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Also expose every HTML template at root level so that relative links such as
// href="booking.html" resolve correctly when the user is on http://localhost:5000/
// (the root URL).  Without this, /booking.html would 404 and fall back to index.html.
app.use(express.static(path.join(FRONTEND, 'templates')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/user',     userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cargo',    cargoRoutes);
app.use('/api/admin',    adminRoutes);

// Public tracking shortcut
app.get('/api/track/:tracking_id', require('./controllers/cargoController').trackCargo);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:   true,
    message:   'Mideye API is running',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

// ─── Frontend Page Routes ─────────────────────────────────────────────────────
// Root → homepage
app.get('/', (req, res) =>
  res.sendFile(path.join(FRONTEND, 'templates', 'index.html')));

// Clean URL aliases (optional but convenient)
const pages = {
  '/login':      'login.html',
  '/register':   'register.html',
  '/booking':    'booking.html',
  '/cargo':      'cargo.html',
  '/tracking':   'tracking.html',
  '/admin':      'admin.html',
  '/dashboard':  'user-dashboard.html',
};
Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) =>
    res.sendFile(path.join(FRONTEND, 'templates', file)));
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  // API requests → JSON 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.path} not found.`,
    });
  }
  // Everything else → serve the homepage (handles direct URL navigation)
  res.sendFile(path.join(FRONTEND, 'templates', 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

module.exports = app;
