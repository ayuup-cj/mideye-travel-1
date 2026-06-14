/**
 * Mideye – API Configuration
 *
 * LOCAL DEV  : runs against http://localhost:5000
 * PRODUCTION : runs against your Render backend URL
 *
 * To deploy:
 *   Replace the PRODUCTION value below with your actual Render URL, e.g.:
 *   'https://mideye-backend.onrender.com'
 */

const IS_LOCAL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// ── Set this to your Render backend URL before deploying ─────────────────────
const PRODUCTION_API = 'https://mideye-travel-1.onrender.com';

// ── Used by api.js and any inline fetch() calls ───────────────────────────────
const API_BASE_URL = IS_LOCAL
  ? 'http://localhost:5000/api'
  : `${PRODUCTION_API}/api`;
