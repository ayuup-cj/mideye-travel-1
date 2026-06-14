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

const WHATSAPP_PAYMENT_NUMBER = '252907562038';

const CITY_LABELS = {
  GLK: 'Galkacyo (GLK)',
  MGQ: 'Mogadishu (MGQ)',
  HGA: 'Hargeisa (HGA)',
  KSM: 'Kismayo (KSM)',
  BDI: 'Baidoa (BDI)',
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (amount) => {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `$${value.toFixed(2)}`;
};

const formatDateLabel = (value) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizeCityLabel = (value) => CITY_LABELS[value] || value || 'Not specified';

const generateReference = (prefix) => {
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  return `MID-${prefix}-${timestamp}${randomSuffix}`;
};

const appendPaymentNote = (notes, paymentMethod) => {
  const base = (notes || '').trim();
  const paymentLine = `Payment Method: ${paymentMethod.label}`;
  return base ? `${base}\n${paymentLine}` : paymentLine;
};

const buildWhatsAppMessage = ({
  bookingReference,
  customerName,
  phoneNumber,
  serviceType,
  destination,
  amount,
  paymentMethodId,
  paymentMethodLabel,
}) => {
  const paymentNote = paymentMethodId === 'mobile_money'
    ? 'Customer chose Mobile Money.'
    : 'Customer will pay at the office (Cash on Office).';

  return `Hello,

I would like to confirm my booking.

Booking Reference: ${bookingReference}
Customer Name: ${customerName}
Phone Number: ${phoneNumber}
Service Type: ${serviceType}
Destination: ${destination}
Amount: ${amount}
Payment Method: ${paymentMethodLabel}
${paymentNote}

Please assist me with payment confirmation.`;
};

const redirectToWhatsApp = (payload) => {
  const message = buildWhatsAppMessage(payload);
  const url = `https://wa.me/${WHATSAPP_PAYMENT_NUMBER}?text=${encodeURIComponent(message)}`;
  window.location.href = url;
};

let confirmPayModalManager = null;

const ensureConfirmPayModalManager = () => {
  if (confirmPayModalManager) return confirmPayModalManager;

  if (!document.getElementById('confirmPayStyles')) {
    const style = document.createElement('style');
    style.id = 'confirmPayStyles';
    style.textContent = `
      .confirm-pay-modal .modal-dialog { max-width: 720px; }
      .confirm-pay-modal .modal-content { border: 1px solid rgba(68, 19, 6, 0.12); border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(68, 19, 6, 0.18); }
      .confirm-pay-modal .modal-header { background: linear-gradient(135deg, #441306 0%, #6b1e0d 100%); color: #fee685; border: 0; padding: 1rem 1.25rem; }
      .confirm-pay-modal .modal-title { color: #fee685; font-size: 1.08rem; font-weight: 700; }
      .confirm-pay-modal .btn-close { filter: invert(100%); opacity: 0.9; }
      .confirm-pay-modal .modal-body { background: #fdf7ed; padding: 1.25rem; }
      .confirm-pay-overview { background: #fff; border: 1px solid rgba(68, 19, 6, 0.1); border-radius: 14px; padding: 1rem; margin-bottom: 1rem; }
      .confirm-pay-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; }
      .confirm-pay-metric { background: #fffaf3; border: 1px solid rgba(68, 19, 6, 0.1); border-radius: 10px; padding: 0.72rem 0.82rem; min-height: 68px; }
      .confirm-pay-metric--amount { grid-column: 1 / -1; background: linear-gradient(135deg, #fff8e8, #fffdf5); border-color: rgba(232, 201, 69, 0.45); }
      .confirm-pay-metric__label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(68, 19, 6, 0.55); font-weight: 700; margin-bottom: 0.2rem; }
      .confirm-pay-metric__value { font-size: 0.9rem; color: #441306; font-weight: 700; word-break: break-word; line-height: 1.35; }
      .confirm-pay-metric--amount .confirm-pay-metric__value { font-size: 1.35rem; color: #441306; }
      .confirm-pay-summary { background: #fff; border: 1px solid rgba(68, 19, 6, 0.1); border-radius: 14px; padding: 0.95rem 1rem; margin-bottom: 1rem; max-height: 220px; overflow-y: auto; }
      .confirm-pay-summary__title { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(68, 19, 6, 0.55); font-weight: 700; margin-bottom: 0.55rem; }
      .confirm-pay-summary__row { display: flex; justify-content: space-between; gap: 0.8rem; padding: 0.42rem 0; border-bottom: 1px dashed rgba(68, 19, 6, 0.15); }
      .confirm-pay-summary__row:last-child { border-bottom: 0; padding-bottom: 0; }
      .confirm-pay-summary__label { font-size: 0.8rem; color: rgba(68, 19, 6, 0.6); flex-shrink: 0; }
      .confirm-pay-summary__value { font-size: 0.84rem; color: #441306; font-weight: 600; text-align: right; }
      .confirm-pay-methods { margin-bottom: 0.9rem; }
      .confirm-pay-methods__title { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(68, 19, 6, 0.55); font-weight: 700; margin-bottom: 0.55rem; }
      .confirm-pay-method-grid { display: grid; gap: 0.65rem; }
      .confirm-pay-method-card { display: flex; align-items: flex-start; gap: 0.75rem; border: 2px solid rgba(68, 19, 6, 0.12); border-radius: 12px; background: #fff; padding: 0.85rem 0.95rem; cursor: pointer; transition: all 0.18s ease; }
      .confirm-pay-method-card:hover { border-color: rgba(107, 30, 13, 0.35); transform: translateY(-1px); }
      .confirm-pay-method-card.active { border-color: #441306; background: #fff8e8; box-shadow: 0 8px 20px rgba(68, 19, 6, 0.1); }
      .confirm-pay-method-input { margin-top: 0.2rem; accent-color: #441306; }
      .confirm-pay-method-label { display: flex; flex-direction: column; line-height: 1.35; }
      .confirm-pay-method-label strong { color: #441306; font-size: 0.92rem; }
      .confirm-pay-method-label span { color: rgba(68, 19, 6, 0.58); font-size: 0.78rem; }
      .confirm-pay-check { background: #fff; border: 1px solid rgba(68, 19, 6, 0.12); border-radius: 12px; padding: 0.85rem; margin-bottom: 0.75rem; }
      .confirm-pay-check .form-check-input { accent-color: #441306; }
      .confirm-pay-check .form-check-label { font-size: 0.86rem; color: rgba(68, 19, 6, 0.78); }
      .confirm-pay-error { display: none; color: #b91c1c; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.65rem; padding: 0.55rem 0.7rem; background: rgba(220, 53, 69, 0.08); border-radius: 8px; }
      .confirm-pay-error.is-visible { display: block; }
      .confirm-pay-actions { display: flex; gap: 0.6rem; }
      .confirm-pay-btn { width: 100%; min-height: 48px; border: 0; border-radius: 12px; background: linear-gradient(135deg, #0f8d5f, #0b6f4b); color: #fff; font-weight: 700; font-size: 0.95rem; }
      .confirm-pay-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      .confirm-pay-note { margin-top: 0.7rem; color: rgba(68, 19, 6, 0.55); font-size: 0.76rem; text-align: center; line-height: 1.45; }
      @media (max-width: 767px) { .confirm-pay-metrics { grid-template-columns: 1fr 1fr; } .confirm-pay-metric--amount { grid-column: 1 / -1; } }
      @media (max-width: 480px) { .confirm-pay-metrics { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  if (!document.getElementById('confirmPayModal')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade confirm-pay-modal" id="confirmPayModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="fas fa-shield-check me-2"></i>Confirm & Pay</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="confirm-pay-overview">
                <div class="confirm-pay-metrics">
                  <div class="confirm-pay-metric"><div class="confirm-pay-metric__label">Booking Reference</div><div id="confirmPayReference" class="confirm-pay-metric__value">-</div></div>
                  <div class="confirm-pay-metric"><div class="confirm-pay-metric__label">Customer Name</div><div id="confirmPayCustomer" class="confirm-pay-metric__value">-</div></div>
                  <div class="confirm-pay-metric"><div class="confirm-pay-metric__label">Service Type</div><div id="confirmPayService" class="confirm-pay-metric__value">-</div></div>
                  <div class="confirm-pay-metric"><div class="confirm-pay-metric__label">Destination</div><div id="confirmPayDestination" class="confirm-pay-metric__value">-</div></div>
                  <div class="confirm-pay-metric"><div class="confirm-pay-metric__label">Date</div><div id="confirmPayDate" class="confirm-pay-metric__value">-</div></div>
                  <div class="confirm-pay-metric confirm-pay-metric--amount"><div class="confirm-pay-metric__label">Total Amount</div><div id="confirmPayAmount" class="confirm-pay-metric__value">-</div></div>
                </div>
              </div>
              <div class="confirm-pay-summary"><div class="confirm-pay-summary__title">Booking Summary</div><div id="confirmPaySummary"></div></div>
              <div class="confirm-pay-methods">
                <div class="confirm-pay-methods__title">Payment Method</div>
                <div class="confirm-pay-method-grid">
                  <label class="confirm-pay-method-card" data-method-card>
                    <input class="confirm-pay-method-input" type="radio" name="confirmPayMethod" value="mobile_money" data-label="Mobile Money" />
                    <span class="confirm-pay-method-label"><strong>Mobile Money</strong><span>Fast transfer confirmation through WhatsApp</span></span>
                  </label>
                  <label class="confirm-pay-method-card" data-method-card>
                    <input class="confirm-pay-method-input" type="radio" name="confirmPayMethod" value="cash_office" data-label="Cash on Office" />
                    <span class="confirm-pay-method-label"><strong>Cash on Office</strong><span>Customer pays directly at the Mideye office</span></span>
                  </label>
                </div>
              </div>
              <div class="confirm-pay-check">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="confirmPayCheckbox" />
                  <label class="form-check-label" for="confirmPayCheckbox">I confirm that all booking information is correct.</label>
                </div>
              </div>
              <p id="confirmPayError" class="confirm-pay-error" aria-live="polite"></p>
              <div class="confirm-pay-actions">
                <button id="confirmPayNowBtn" type="button" class="confirm-pay-btn" disabled><i class="fab fa-whatsapp me-2"></i>Pay Now</button>
              </div>
              <p class="confirm-pay-note">After clicking Pay Now, you will be redirected to WhatsApp for payment coordination.</p>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  const modalEl = document.getElementById('confirmPayModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const refs = {
    reference: document.getElementById('confirmPayReference'),
    customer: document.getElementById('confirmPayCustomer'),
    service: document.getElementById('confirmPayService'),
    destination: document.getElementById('confirmPayDestination'),
    date: document.getElementById('confirmPayDate'),
    amount: document.getElementById('confirmPayAmount'),
    summary: document.getElementById('confirmPaySummary'),
    payNowBtn: document.getElementById('confirmPayNowBtn'),
    confirmCheckbox: document.getElementById('confirmPayCheckbox'),
    error: document.getElementById('confirmPayError'),
  };
  const methodCards = Array.from(modalEl.querySelectorAll('[data-method-card]'));
  const methodInputs = Array.from(modalEl.querySelectorAll('input[name="confirmPayMethod"]'));
  const state = { onPay: null };
  const getSelectedMethod = () => methodInputs.find((input) => input.checked) || null;
  const syncMethodCardState = () => {
    methodCards.forEach((card) => {
      const cardInput = card.querySelector('input[name="confirmPayMethod"]');
      card.classList.toggle('active', !!cardInput?.checked);
    });
  };
  const updatePayButtonState = () => {
    refs.payNowBtn.disabled = !(getSelectedMethod() && refs.confirmCheckbox.checked);
  };
  methodCards.forEach((card) => {
    card.addEventListener('click', () => {
      const input = card.querySelector('input[name="confirmPayMethod"]');
      if (!input) return;
      input.checked = true;
      refs.error.classList.remove('is-visible');
      syncMethodCardState();
      updatePayButtonState();
    });
  });
  methodInputs.forEach((input) => {
    input.addEventListener('change', () => { refs.error.classList.remove('is-visible'); syncMethodCardState(); updatePayButtonState(); });
  });
  refs.confirmCheckbox.addEventListener('change', () => { refs.error.classList.remove('is-visible'); updatePayButtonState(); });
  refs.payNowBtn.addEventListener('click', async () => {
    const selectedMethod = getSelectedMethod();
    if (!selectedMethod || !refs.confirmCheckbox.checked || typeof state.onPay !== 'function') {
      refs.error.textContent = !selectedMethod && !refs.confirmCheckbox.checked
        ? 'Please select a payment method and confirm your booking details.'
        : !selectedMethod ? 'Please select a payment method before continuing.' : 'Please confirm that all booking information is correct.';
      refs.error.classList.add('is-visible');
      updatePayButtonState();
      return;
    }
    refs.error.textContent = '';
    refs.error.classList.remove('is-visible');
    refs.payNowBtn.dataset.originalText = refs.payNowBtn.dataset.originalText || refs.payNowBtn.innerHTML;
    refs.payNowBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    refs.payNowBtn.disabled = true;
    try {
      await state.onPay({ id: selectedMethod.value, label: selectedMethod.dataset.label || selectedMethod.value });
      modal.hide();
    } catch (error) {
      refs.error.textContent = error?.message || 'Unable to process this request right now. Please try again.';
      refs.error.classList.add('is-visible');
    } finally {
      refs.payNowBtn.innerHTML = refs.payNowBtn.dataset.originalText;
      updatePayButtonState();
    }
  });
  modalEl.addEventListener('hidden.bs.modal', () => {
    methodInputs.forEach((input) => { input.checked = false; });
    refs.confirmCheckbox.checked = false;
    refs.error.textContent = '';
    refs.error.classList.remove('is-visible');
    syncMethodCardState();
    updatePayButtonState();
    state.onPay = null;
  });
  confirmPayModalManager = {
    open: ({ reference, customerName, serviceType, destination, date, totalAmount, summaryItems, onPay }) => {
      refs.reference.textContent = reference || '-';
      refs.customer.textContent = customerName || '-';
      refs.service.textContent = serviceType || '-';
      refs.destination.textContent = destination || '-';
      refs.date.textContent = date || '-';
      refs.amount.textContent = totalAmount || '-';
      refs.summary.innerHTML = Array.isArray(summaryItems)
        ? summaryItems.map((item) => `
            <div class="confirm-pay-summary__row">
              <span class="confirm-pay-summary__label">${escapeHtml(item.label || '')}</span>
              <span class="confirm-pay-summary__value">${escapeHtml(item.value || '')}</span>
            </div>`).join('')
        : '';
      state.onPay = onPay;
      methodInputs.forEach((input) => { input.checked = false; });
      refs.confirmCheckbox.checked = false;
      refs.error.textContent = '';
      refs.error.classList.remove('is-visible');
      syncMethodCardState();
      updatePayButtonState();
      modal.show();
    },
  };
  return confirmPayModalManager;
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
    e.stopImmediatePropagation();

    if (window.mideyeRegisterValidation?.validateBeforeSubmit &&
        !window.mideyeRegisterValidation.validateBeforeSubmit()) {
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    const full_name = (document.getElementById('regFullName')?.value || form.querySelector('input[type="text"]')?.value || '').trim();
    const email = (document.getElementById('regEmail')?.value || form.querySelector('input[type="email"]')?.value || '').trim().toLowerCase();
    const password = document.getElementById('regPassword')?.value || '';
    const confirm = document.getElementById('regConfirm')?.value || '';

    if (password !== confirm) {
      showAlert('Passwords do not match.', 'error');
      return;
    }

    setButtonLoading(btn, true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('mideye_token', data.data.token);
        localStorage.setItem('mideye_user', JSON.stringify(data.data.user));
        showAlert('Account created successfully! Redirecting…', 'success');
        setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 1200);
      } else {
        const msg = data.errors ? data.errors.map((item) => item.message).join('<br>') : data.message;
        showAlert(msg, 'error');
      }
    } catch (err) {
      showAlert('Cannot connect to server. Make sure the backend is running.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  }, { capture: true });
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
