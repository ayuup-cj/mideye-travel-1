require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cargoRoutes   = require('./routes/cargoRoutes');
const adminRoutes   = require('./routes/adminRoutes');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'null'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve Static Frontend ────────────────────────────────────────────────────
// Serves CSS/JS/image assets from project root, HTML pages from templates/
app.use(express.static(path.join(__dirname, '..')));
app.use('/templates', express.static(path.join(__dirname, '..', 'templates')));

// Root "/" → redirect to homepage
app.get('/', (req, res) => {
  res.redirect('/templates/index.html');
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/user',     userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cargo',    cargoRoutes);
app.use('/api/admin',    adminRoutes);

// Public tracking shortcut: GET /api/track/:tracking_id
app.get('/api/track/:tracking_id', require('./controllers/cargoController').trackCargo);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mideye API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  // If it's an API request, return JSON 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
  }
  // Otherwise serve the frontend index from templates/
  res.sendFile(path.join(__dirname, '..', 'templates', 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

module.exports = app;
