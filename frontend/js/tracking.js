/**
 * Mideye – Combined Cargo Tracking UI
 * Merges "Track Your Shipment" + "Cargo Details" + operational timeline.
 * Demo data for offline testing; falls back to API when available.
 */

// ─── Demo shipments (use these IDs to test) ────────────────────────────────────
const DEMO_SHIPMENTS = {
  'MID-2026-001456': {
    tracking_id: 'MID-2026-001456',
    status: 'In Transit',
    contents: 'Electronics & Machinery Parts',
    origin: 'Galkacyo (GLK)',
    destination: 'Mogadishu (MGQ)',
    departure: 'Jan 15, 2026 at 10:30 AM',
    expected: 'Jan 16, 2026 at 2:00 PM',
    sender_name: 'Mohamed Abdi Jama',
    sender_phone: '+252 61 5551234',
    recipient_name: 'Ahmed Hassan Mohamed',
    recipient_phone: '+252 61 1234567',
    route: 'Galkacyo → Mogadishu',
    weight: 45.5,
    description: 'Industrial spare parts, sealed cartons × 3. Handle with care.',
    sent_on: 'January 15, 2026',
    last_update: 'January 15, 2026 at 4:20 PM',
    payment: 'Paid',
    shipment_price: 125.00,
    sgs_fee: 15.00,
    ops_timeline: [
      { step: 'Picked Up', state: 'done', date: 'Jan 15, 2026 · 10:30 AM', note: 'Cargo collected from sender in Galkacyo.' },
      { step: 'Quality Check', state: 'done', tag: 'Passed', date: 'Jan 15, 2026 · 11:45 AM', note: 'All safety and quality inspections passed.' },
      { step: 'Loaded on Aircraft', state: 'done', date: 'Jan 15, 2026 · 2:15 PM', note: 'Loaded on flight SOM-2847.' },
      { step: 'In Transit', state: 'active', date: 'Currently airborne', note: 'Shipment is on its way to Mogadishu.' },
    ],
  },

  'ME-CG-20260519-FJ4Z': {
    tracking_id: 'ME-CG-20260519-FJ4Z',
    status: 'Arrived',
    contents: 'Textiles & Clothing',
    origin: 'Hargeisa (HGA)',
    destination: 'Galkacyo (GLK)',
    departure: 'May 18, 2026 at 8:00 AM',
    expected: 'May 19, 2026 at 11:00 AM',
    sender_name: 'Fatima Ali Hassan',
    sender_phone: '+252 63 9876543',
    recipient_name: 'Yusuf Abdirahman Ali',
    recipient_phone: '+252 90 7654321',
    route: 'Hargeisa → Galkacyo',
    weight: 22.0,
    description: 'Commercial textile bundles, 8 pieces. Standard handling.',
    sent_on: 'May 18, 2026',
    last_update: 'May 19, 2026 at 9:15 AM',
    payment: 'Pending',
    shipment_price: 89.00,
    sgs_fee: 12.00,
    ops_timeline: [
      { step: 'Picked Up', state: 'done', date: 'May 18, 2026 · 8:00 AM', note: 'Picked up from Hargeisa warehouse.' },
      { step: 'Quality Check', state: 'paused', tag: 'Paused', date: 'May 18, 2026 · 9:30 AM', note: 'Inspection paused — awaiting customs clearance document.' },
      { step: 'Loaded on Aircraft', state: 'done', date: 'May 18, 2026 · 3:00 PM', note: 'Cleared and loaded on ME-CG flight.' },
      { step: 'In Transit', state: 'done', date: 'May 19, 2026 · 6:00 AM', note: 'Arrived at Galkacyo hub. Awaiting final delivery.' },
    ],
  },
};

// Map backend statuses → pipeline step index (0–3)
const PIPELINE_STEPS = ['Pending', 'In Transit', 'Arrived', 'Delivered'];
const STATUS_TO_PIPELINE = {
  'Received':    0,
  'Pending':     0,
  'In Transit':  1,
  'Arrived':     2,
  'Delivered':   3,
  'Cancelled':   0,
};

const formatMoney = (n) => `$${Number(n).toFixed(2)}`;

const getPipelineIndex = (status) => STATUS_TO_PIPELINE[status] ?? 0;

const getBadgeClass = (status) => {
  const map = {
    Pending: 'pending', Received: 'pending',
    'In Transit': 'transit',
    Arrived: 'arrived',
    Delivered: 'delivered',
  };
  return map[status] || 'pending';
};

// ─── Build ops timeline from API cargo when demo ops_timeline missing ────────
const buildOpsFromStatus = (status, createdAt) => {
  const idx = getPipelineIndex(status);
  const steps = [
    { step: 'Picked Up', icon: 'fa-box' },
    { step: 'Quality Check', icon: 'fa-clipboard-check' },
    { step: 'Loaded on Aircraft', icon: 'fa-plane-departure' },
    { step: 'In Transit', icon: 'fa-plane' },
  ];
  return steps.map((s, i) => ({
    step: s.step,
    state: i < idx ? 'done' : i === idx ? 'active' : 'pending',
    tag: s.step === 'Quality Check' && i <= idx ? 'Passed' : null,
    date: i <= idx ? (createdAt ? new Date(createdAt).toLocaleString() : 'Completed') : 'Pending',
    note: i < idx ? `${s.step} completed.` : i === idx ? `Currently at: ${s.step}` : 'Awaiting previous steps.',
  }));
};

// Normalize API response → unified shipment object
const normalizeApiCargo = ({ cargo, timeline }) => {
  const created = cargo.created_at ? new Date(cargo.created_at) : new Date();
  const updated = cargo.updated_at ? new Date(cargo.updated_at) : created;
  const weight = parseFloat(cargo.weight) || 0;
  const price = weight * 2.5 + 5;

  return {
    tracking_id: cargo.tracking_id,
    status: cargo.status === 'Received' ? 'Pending' : cargo.status,
    contents: cargo.cargo_type || 'General Cargo',
    origin: cargo.origin || 'Galkacyo (GLK)',
    destination: cargo.destination || '—',
    departure: created.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    expected: new Date(created.getTime() + 86400000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    sender_name: cargo.sender_name || '—',
    sender_phone: cargo.sender_phone || '—',
    recipient_name: cargo.recipient_name || '—',
    recipient_phone: cargo.recipient_phone || '—',
    route: `${cargo.origin || 'GLK'} → ${cargo.destination || '—'}`,
    weight,
    description: cargo.description || `${cargo.cargo_type || 'Cargo'} — ${cargo.pieces || 1} piece(s)`,
    sent_on: created.toLocaleDateString('en-US', { dateStyle: 'long' }),
    last_update: updated.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    payment: 'Paid',
    shipment_price: price,
    sgs_fee: 10,
    ops_timeline: buildOpsFromStatus(cargo.status, cargo.created_at),
  };
};

// ─── Render combined tracking UI ───────────────────────────────────────────────
const renderMideyeTracking = (shipment) => {
  const container   = document.getElementById('trackingResult');
  const notFound    = document.getElementById('trackingNotFound');
  if (!container) return;

  notFound?.classList.remove('is-visible');
  container.classList.add('is-visible');

  const pipeIdx = getPipelineIndex(shipment.status);
  const fillPct = pipeIdx <= 0 ? 0 : (pipeIdx / (PIPELINE_STEPS.length - 1)) * 84;

  const pipelineHtml = PIPELINE_STEPS.map((label, i) => {
    const cls = i < pipeIdx ? 'done' : i === pipeIdx ? 'active' : '';
    const icons = ['fa-clock', 'fa-plane', 'fa-map-marker-alt', 'fa-check-circle'];
    return `
      <div class="track-pipeline__step ${cls}">
        <div class="track-pipeline__dot"><i class="fas ${icons[i]}"></i></div>
        <span class="track-pipeline__label">${label}</span>
      </div>`;
  }).join('');

  const opsHtml = (shipment.ops_timeline || []).map((item) => {
    const tagHtml = item.tag
      ? `<span class="track-ops-tag track-ops-tag--${item.tag === 'Paused' ? 'paused' : 'passed'}">${item.tag}</span>`
      : '';
    return `
      <div class="track-ops-item ${item.state}">
        <div class="track-ops-marker">
          <i class="fas ${
            item.state === 'done' ? 'fa-check' :
            item.state === 'active' ? 'fa-plane' :
            item.state === 'paused' ? 'fa-pause' : 'fa-circle'
          }"></i>
        </div>
        <div class="track-ops-content">
          <h4>${item.step}${tagHtml}</h4>
          <div class="track-ops-date">${item.date}</div>
          <p class="track-ops-note">${item.note}</p>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <!-- Shipment overview -->
    <section class="track-shipment-card" aria-label="Shipment overview">
      <div class="track-shipment-card__top">
        <div class="track-shipment-card__icon"><i class="fas fa-box"></i></div>
        <div class="track-shipment-card__title">
          <h2>Shipment ${shipment.tracking_id}</h2>
          <p class="track-shipment-card__subtitle">${shipment.contents}</p>
        </div>
        <span class="track-status-badge track-status-badge--${getBadgeClass(shipment.status)}">
          <i class="fas fa-circle" style="font-size:0.45rem;"></i> ${shipment.status}
        </span>
      </div>
      <div class="track-route-grid">
        <div class="track-route-point">
          <div class="track-route-point__label">Origin</div>
          <div class="track-route-point__city">${shipment.origin}</div>
          <div class="track-route-point__meta">Departure: ${shipment.departure}</div>
        </div>
        <div class="track-route-arrow"><i class="fas fa-plane"></i></div>
        <div class="track-route-point track-route-point--dest">
          <div class="track-route-point__label">Destination</div>
          <div class="track-route-point__city">${shipment.destination}</div>
          <div class="track-route-point__meta">Expected: ${shipment.expected}</div>
        </div>
      </div>
    </section>

    <!-- Status pipeline -->
    <section class="track-pipeline" aria-label="Delivery status">
      <div class="track-pipeline__title"><i class="fas fa-route me-2"></i>Delivery Status</div>
      <div class="track-pipeline__steps">
        <div class="track-pipeline__fill" style="width:${fillPct}%;"></div>
        ${pipelineHtml}
      </div>
    </section>

    <!-- Cargo Details -->
    <section class="track-details-card" aria-label="Cargo details">
      <div class="track-details-card__header">
        <h3><i class="fas fa-file-alt me-2"></i>Cargo Details</h3>
        <span class="track-details-card__id">${shipment.tracking_id}</span>
      </div>
      <div class="track-details-grid">
        <div class="track-detail-item">
          <div class="track-detail-item__label">Sender</div>
          <div class="track-detail-item__value">${shipment.sender_name}<br><span style="font-weight:500;color:var(--text-muted);">${shipment.sender_phone}</span></div>
        </div>
        <div class="track-detail-item">
          <div class="track-detail-item__label">Receiver</div>
          <div class="track-detail-item__value">${shipment.recipient_name}<br><span style="font-weight:500;color:var(--text-muted);">${shipment.recipient_phone}</span></div>
        </div>
        <div class="track-detail-item">
          <div class="track-detail-item__label">Route</div>
          <div class="track-detail-item__value">${shipment.route}</div>
        </div>
        <div class="track-detail-item">
          <div class="track-detail-item__label">Weight</div>
          <div class="track-detail-item__value">${shipment.weight} kg</div>
        </div>
        <div class="track-detail-item track-detail-item--full">
          <div class="track-detail-item__label">Contents Description</div>
          <div class="track-detail-item__value">${shipment.description}</div>
        </div>
        <div class="track-detail-item">
          <div class="track-detail-item__label">Sent On</div>
          <div class="track-detail-item__value">${shipment.sent_on}</div>
        </div>
        <div class="track-detail-item">
          <div class="track-detail-item__label">Last Update</div>
          <div class="track-detail-item__value">${shipment.last_update}</div>
        </div>
        <div class="track-detail-item track-detail-item--payment">
          <div class="track-detail-item__label">Payment</div>
          <div class="track-detail-item__value ${shipment.payment === 'Paid' ? 'paid' : 'pending'}">${shipment.payment}</div>
        </div>
        <div class="track-detail-item">
          <div class="track-detail-item__label">Shipment Price + SGS</div>
          <div class="track-detail-item__value track-detail-item__value--price">
            ${formatMoney(shipment.shipment_price)} <span style="font-size:0.8rem;font-weight:600;color:var(--text-muted);">+ SGS ${formatMoney(shipment.sgs_fee)}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Operational timeline -->
    <section class="track-ops-card" aria-label="Shipment status timeline">
      <h3><i class="fas fa-list-check me-2"></i>Shipment Status Timeline</h3>
      <div class="track-ops-timeline">${opsHtml}</div>
    </section>

    <!-- Chat with MidEye -->
    <footer class="track-chat-footer">
      <div class="track-chat-footer__text">
        <strong>Need help with this shipment?</strong>
        Our team is available 24/7 on WhatsApp and phone.
      </div>
      <a href="https://wa.me/252615000000" target="_blank" rel="noopener" class="track-chat-btn">
        <i class="fab fa-whatsapp"></i> Chat with MidEye
      </a>
    </footer>`;

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const showNotFound = (trackingId) => {
  const container = document.getElementById('trackingResult');
  const notFound  = document.getElementById('trackingNotFound');
  container?.classList.remove('is-visible');
  if (notFound) {
    const idEl = notFound.querySelector('.track-not-found__id');
    if (idEl) idEl.textContent = trackingId;
    notFound.classList.add('is-visible');
    notFound.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// ─── Search: demo first, then API ────────────────────────────────────────────
const searchShipment = async (trackingId) => {
  const id = trackingId.trim().toUpperCase();

  if (DEMO_SHIPMENTS[id]) {
    renderMideyeTracking(DEMO_SHIPMENTS[id]);
    return;
  }

  // Try API
  const apiBase = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api';
  try {
    const res  = await fetch(`${apiBase}/track/${encodeURIComponent(id)}`);
    const data = await res.json();
    if (data.success) {
      renderMideyeTracking(normalizeApiCargo(data.data));
    } else {
      showNotFound(id);
    }
  } catch {
    showNotFound(id);
  }
};

// ─── Init ──────────────────────────────────────────────────────────────────────
const initMideyeTracking = () => {
  const form  = document.getElementById('trackingForm');
  const input = document.getElementById('trackingNumber');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const id  = input?.value.trim();
    if (!id) return;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Tracking…';
    }

    await searchShipment(id);

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-search me-2"></i>Track';
    }
  });

  // Click demo IDs to auto-fill
  document.querySelectorAll('[data-demo-id]').forEach((el) => {
    el.addEventListener('click', () => {
      if (input) input.value = el.dataset.demoId;
      searchShipment(el.dataset.demoId);
    });
  });

  // Auto-track from URL ?id=MID-...
  const urlId = new URLSearchParams(window.location.search).get('id');
  if (urlId) {
    if (input) input.value = urlId;
    searchShipment(urlId);
  }
};

window.renderMideyeTracking = renderMideyeTracking;
window.initMideyeTracking   = initMideyeTracking;

document.addEventListener('DOMContentLoaded', initMideyeTracking);
