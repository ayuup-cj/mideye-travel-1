/**
 * Mideye Travel Agency – Frontend API Integration
 * Connects HTML forms to the Node.js backend at http://localhost:5000
 */

// API_BASE_URL is set by config.js (loaded before this file in every HTML page)
const API_BASE = typeof API_BASE_URL !== 'undefined'
  ? API_BASE_URL
  : 'http://localhost:5000/api'; // fallback for direct open without config.js

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem('mideye_token');
const getUser  = () => JSON.parse(localStorage.getItem('mideye_user') || 'null');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const showAlert = (message, type = 'success', containerId = 'alertBox') => {
  let box = document.getElementById(containerId);
  if (!box) {
    box = document.createElement('div');
    box.id = containerId;
    document.querySelector('main .container')?.prepend(box);
  }
  box.innerHTML = `
    <div class="alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show mt-3" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const setButtonLoading = (btn, loading) => {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Please wait…';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
};

// ─── Unified navbar auth component (matches index.html / main.js exactly) ─────

const updateNavbar = () => {
  try {
    const token     = localStorage.getItem('mideye_token');
    const user      = getUser();
    const dashItem  = document.getElementById('navDashboardItem');
    const dashLink  = document.getElementById('navDashboardLink');
    const authBtns  = document.getElementById('navAuthButtons');

    if (!token || !user) return;

    // Show Dashboard link with correct target for this role
    if (dashItem && dashLink) {
      dashItem.style.display = '';
      dashLink.href = user.role === 'admin' ? 'admin.html' : 'user-dashboard.html';
    }

    // Replace Login / Register with username pill + Logout — identical to index.html
    if (authBtns) {
      authBtns.innerHTML = `
        <span class="btn-outline-custom" style="font-size:0.85rem;padding:0.6rem 1.3rem;pointer-events:none;opacity:0.85;">
          <i class="fas fa-user-circle me-1"></i>${(user.full_name || 'User').split(' ')[0]}
        </span>
        <button onclick="mideyeLogout()" class="btn-gold-custom" style="font-size:0.85rem;padding:0.6rem 1.3rem;border:none;cursor:pointer;">
          <i class="fas fa-sign-out-alt me-1"></i>Logout
        </button>`;
    }
  } catch (e) {}
};

window.mideyeLogout = function () {
  localStorage.removeItem('mideye_token');
  localStorage.removeItem('mideye_user');
  window.location.reload();
};

// ─── LOGIN FORM  (login.html) ─────────────────────────────────────────────────

const initLoginForm = () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const email    = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;

    setButtonLoading(btn, true);

    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('mideye_token', data.data.token);
        localStorage.setItem('mideye_user',  JSON.stringify(data.data.user));
        showAlert('Login successful! Redirecting…', 'success');
        setTimeout(() => {
          const role = data.data.user.role;
          window.location.href = role === 'admin' ? 'admin.html' : 'user-dashboard.html';
        }, 1000);
      } else {
        showAlert(data.message || 'Login failed. Please try again.', 'error');
      }
    } catch (err) {
      showAlert('Cannot connect to server. Make sure the backend is running.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
};

// ─── REGISTER FORM  (register.html) ──────────────────────────────────────────

const initRegisterForm = () => {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn      = form.querySelector('[type="submit"]');
    const full_name = form.querySelector('input[type="text"]').value.trim();
    const email     = form.querySelector('input[type="email"]').value.trim();
    const password  = document.getElementById('regPassword').value;
    const confirm   = document.getElementById('regConfirm').value;

    if (password !== confirm) {
      showAlert('Passwords do not match.', 'error');
      return;
    }

    setButtonLoading(btn, true);

    try {
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('mideye_token', data.data.token);
        localStorage.setItem('mideye_user',  JSON.stringify(data.data.user));
        showAlert('Account created successfully! Redirecting…', 'success');
        setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 1200);
      } else {
        const msg = data.errors ? data.errors.map(e => e.message).join('<br>') : data.message;
        showAlert(msg, 'error');
      }
    } catch (err) {
      showAlert('Cannot connect to server. Make sure the backend is running.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
};

// ─── BOOKING FORM  (booking.html) ─────────────────────────────────────────────

const initBookingForm = () => {
  const form = document.getElementById('flightBookingForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');

    const origin      = form.querySelectorAll('select')[0].value;
    const destination = form.querySelectorAll('select')[1].value;
    const travel_date = form.querySelectorAll('input[type="date"]')[0].value;
    const return_date = form.querySelectorAll('input[type="date"]')[1]?.value || null;
    const adults      = form.querySelectorAll('select')[2]?.value || 1;
    const children    = form.querySelectorAll('select')[3]?.value || 0;
    const infants     = form.querySelectorAll('select')[4]?.value || 0;
    const cabin_class = form.querySelector('input[name="cabinClass"]:checked')?.value || 'economy';
    const trip_type   = form.querySelector('input[name="tripType"]:checked')?.value || 'oneway';
    const first_name  = form.querySelectorAll('input[type="text"]')[0]?.value.trim();
    const last_name   = form.querySelectorAll('input[type="text"]')[1]?.value.trim();
    const email       = form.querySelector('input[type="email"]')?.value.trim();
    const phone       = form.querySelector('input[type="tel"]')?.value.trim();
    const special_requests = form.querySelector('textarea')?.value.trim() || '';

    if (!origin || !destination || !travel_date || !first_name || !last_name || !email || !phone) {
      showAlert('Please fill in all required fields.', 'error');
      return;
    }

    setButtonLoading(btn, true);

    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          trip_type, first_name, last_name, email, phone,
          origin, destination, travel_date, return_date,
          adults, children, infants, cabin_class, special_requests,
        }),
      });
      const data = await res.json();

      if (data.success) {
        const modalEl = document.getElementById('bookingModal');
        if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

        const isLoggedIn = !!getToken();
        const dashLink = isLoggedIn
          ? `<br><a href="user-dashboard.html" style="color:var(--brown);font-weight:700;">View in My Dashboard →</a>`
          : '';

        showAlert(
          `<strong>Booking Request Received!</strong><br>
           Thank you, ${first_name}! Your booking is <strong>Pending</strong> and will appear on your dashboard.
           We will contact you at <strong>${phone}</strong> to confirm.${dashLink}`,
          'success'
        );
        form.reset();
        document.getElementById('selectedFlightSummary')?.classList.remove('is-visible');

        if (isLoggedIn) {
          setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 2500);
        }
      } else {
        const msg = data.errors ? data.errors.map(e => e.message).join('<br>') : data.message;
        showAlert(msg, 'error');
      }
    } catch (err) {
      showAlert('Cannot connect to server. Make sure the backend is running.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
};

// ─── CARGO FORM  (cargo.html) ──────────────────────────────────────────────────

const initCargoForm = () => {
  const form = document.getElementById('cargoRequestForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');

    const textInputs = form.querySelectorAll('input[type="text"]');
    const telInputs  = form.querySelectorAll('input[type="tel"]');
    const emailInput = form.querySelector('input[type="email"]');
    const selects    = form.querySelectorAll('select');
    const numInputs  = form.querySelectorAll('input[type="number"]');
    const textareas  = form.querySelectorAll('textarea');

    const payload = {
      sender_name:       textInputs[0]?.value.trim(),
      sender_phone:      telInputs[0]?.value.trim(),
      sender_email:      emailInput?.value.trim() || '',
      sender_address:    textInputs[1]?.value.trim() || '',
      recipient_name:    textInputs[2]?.value.trim() || '',
      recipient_phone:   telInputs[1]?.value.trim() || '',
      destination:       selects[0]?.value,
      cargo_type:        selects[1]?.value,
      pieces:            numInputs[0]?.value || 1,
      weight:            numInputs[1]?.value,
      length_cm:         numInputs[2]?.value || null,
      width_cm:          numInputs[3]?.value || null,
      description:       textareas[0]?.value.trim() || '',
      shipping_speed:    form.querySelector('input[name="shippingSpeed"]:checked')?.value || 'standard',
      insurance:         document.getElementById('insuranceCheck')?.checked || false,
      fragile:           document.getElementById('fragile')?.checked || false,
      signature_required: document.getElementById('signature')?.checked || false,
      special_requests:  textareas[1]?.value.trim() || '',
    };

    setButtonLoading(btn, true);

    try {
      const res  = await fetch(`${API_BASE}/cargo`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        const dashLink = getToken()
          ? `<br><a href="user-dashboard.html" style="color:var(--brown);font-weight:700;">View in My Dashboard →</a>`
          : '';
        showAlert(
          `<strong>Cargo Request Submitted!</strong><br>
           Your tracking ID is: <strong style="font-size:1.2rem;color:var(--brown);">${data.data.tracking_id}</strong><br>
           <small class="text-muted">Save this ID to track your shipment on the tracking page.</small>${dashLink}`,
          'success'
        );
        form.reset();
      } else {
        const msg = data.errors ? data.errors.map(e => e.message).join('<br>') : data.message;
        showAlert(msg, 'error');
      }
    } catch (err) {
      showAlert('Cannot connect to server. Make sure the backend is running.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
};

// ─── TRACKING FORM  (tracking.html) ──────────────────────────────────────────

const initTrackingForm = () => {
  const form = document.getElementById('trackingForm');
  if (!form) return;

  // tracking.js handles the full combined UI on tracking.html
  if (typeof window.initMideyeTracking === 'function') return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn        = form.querySelector('[type="submit"]');
    const trackingId = document.getElementById('trackingNumber').value.trim().toUpperCase();

    if (!trackingId) {
      showAlert('Please enter a tracking number.', 'error');
      return;
    }

    setButtonLoading(btn, true);

    try {
      const res  = await fetch(`${API_BASE}/track/${trackingId}`);
      const data = await res.json();

      if (data.success) {
        renderTrackingResult(data.data);
      } else {
        showAlert(data.message, 'error');
      }
    } catch (err) {
      showAlert('Cannot connect to server. Make sure the backend is running.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
};

const renderTrackingResult = ({ cargo, timeline }) => {
  const statusColors = { Received: 'secondary', 'In Transit': 'warning', Arrived: 'success', Cancelled: 'danger' };
  const badge = `<span class="badge bg-${statusColors[cargo.status] || 'secondary'}" style="padding:0.5rem 1rem;">${cargo.status}</span>`;

  const timelineHtml = timeline.map(item => `
    <div class="timeline-item ${item.completed ? 'completed' : ''} ${item.active ? 'active' : ''}">
      <div class="timeline-marker">
        <i class="fas ${item.completed ? 'fa-check' : item.active ? 'fa-plane' : 'fa-circle'}"></i>
      </div>
      <div class="timeline-content">
        <h6 class="fw-600 mb-1" style="color:var(--brown);">${item.status}</h6>
        <p class="small mb-0 text-muted">${item.active ? 'Current status' : item.completed ? 'Completed' : 'Pending'}</p>
      </div>
    </div>`).join('');

  const resultHtml = `
    <div class="card border-0 shadow-sm p-4 mt-4" style="background:var(--cream);border-radius:var(--r-lg);">
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h5 class="fw-700 mb-1" style="color:var(--brown);">Tracking: ${cargo.tracking_id}</h5>
          <p class="text-muted small mb-0">${cargo.cargo_type} • ${cargo.weight} kg • ${cargo.pieces} piece(s)</p>
        </div>
        <div>${badge}</div>
      </div>
      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <p class="small text-muted mb-1">From</p>
          <p class="fw-600" style="color:var(--brown);">${cargo.origin}</p>
          <p class="small text-muted mb-1 mt-2">Sender</p>
          <p class="fw-600" style="color:var(--brown);">${cargo.sender_name}</p>
        </div>
        <div class="col-md-6">
          <p class="small text-muted mb-1">To</p>
          <p class="fw-600" style="color:var(--brown);">${cargo.destination}</p>
          <p class="small text-muted mb-1 mt-2">Recipient</p>
          <p class="fw-600" style="color:var(--brown);">${cargo.recipient_name} • ${cargo.recipient_phone}</p>
        </div>
      </div>
      <hr style="border-color:var(--border);">
      <h6 class="fw-700 mb-3" style="color:var(--brown);">Shipment Progress</h6>
      <div class="timeline">${timelineHtml}</div>
    </div>`;

  let resultContainer = document.getElementById('trackingResult');
  if (!resultContainer) {
    resultContainer = document.createElement('div');
    resultContainer.id = 'trackingResult';
    form?.parentElement?.insertAdjacentElement('afterend', resultContainer) ||
      document.querySelector('main .container')?.appendChild(resultContainer);
  }
  resultContainer.innerHTML = resultHtml;
  resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ─── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  initLoginForm();
  initRegisterForm();
  initBookingForm();
  initCargoForm();
  initTrackingForm();
});
