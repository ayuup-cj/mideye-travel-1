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

const TEMP_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  'dispostable.com',
  'fakeinbox.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'sharklasers.com',
  'tempmail.com',
  'trashmail.com',
  'yopmail.com',
]);

const isLikelyTemporaryEmail = (email) => {
  const [, rawDomain = ''] = (email || '').split('@');
  const domain = rawDomain.toLowerCase().trim();
  if (!domain) return false;
  if (TEMP_EMAIL_DOMAINS.has(domain)) return true;
  return /(mailinator|tempmail|10minutemail|guerrillamail|trashmail|yopmail|fakeinbox|dispostable|maildrop|sharklasers)/i.test(domain);
};

const initRegisterForm = () => {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const fullNameInput = form.querySelector('#regFullName');
  const emailInput    = form.querySelector('#regEmail');
  const passwordInput = form.querySelector('#regPassword');
  const confirmInput  = form.querySelector('#regConfirm');

  if (!fullNameInput || !emailInput || !passwordInput || !confirmInput) return;

  const feedbackEls = {
    full_name: form.querySelector('#regFullNameFeedback'),
    email:     form.querySelector('#regEmailFeedback'),
    password:  form.querySelector('#regPasswordFeedback'),
    confirm:   form.querySelector('#regConfirmFeedback'),
  };
  const statusIcons = {
    full_name: form.querySelector('#regFullNameStatusIcon'),
    email:     form.querySelector('#regEmailStatusIcon'),
    password:  form.querySelector('#regPasswordStatusIcon'),
    confirm:   form.querySelector('#regConfirmStatusIcon'),
  };
  const strengthBarWrap = document.getElementById('regPasswordStrengthBarWrap');
  const strengthBar = document.getElementById('regPasswordStrengthBar');
  const strengthText = document.getElementById('regPasswordStrengthText');
  const checklist = document.getElementById('regPasswordChecklist');

  const markFieldState = (inputEl, key, valid, message) => {
    inputEl.classList.remove('is-valid', 'is-invalid');
    inputEl.setAttribute('aria-invalid', 'false');

    if (message) {
      inputEl.classList.add(valid ? 'is-valid' : 'is-invalid');
      inputEl.setAttribute('aria-invalid', valid ? 'false' : 'true');
    }

    const feedback = feedbackEls[key];
    if (feedback) {
      feedback.textContent = message || '';
      feedback.classList.remove('valid', 'invalid');
      if (message) feedback.classList.add(valid ? 'valid' : 'invalid');
    }

    const icon = statusIcons[key];
    if (icon) {
      icon.className = 'field-status-icon';
      icon.innerHTML = '';
      if (message) {
        icon.classList.add('visible', valid ? 'valid' : 'invalid');
        icon.innerHTML = valid
          ? '<i class="fas fa-circle-check"></i>'
          : '<i class="fas fa-circle-exclamation"></i>';
      }
    }
  };

  const updatePasswordChecklist = (rules) => {
    if (!checklist) return;
    checklist.querySelectorAll('li[data-rule]').forEach((item) => {
      const ruleName = item.dataset.rule;
      const passed = Boolean(rules[ruleName]);
      item.classList.toggle('valid', passed);
      const icon = item.querySelector('i');
      if (icon) {
        icon.className = passed ? 'fas fa-check-circle' : 'fa-regular fa-circle';
      }
    });
  };

  const updatePasswordStrength = (password, rules) => {
    if (!strengthBar || !strengthText || !strengthBarWrap) return;

    if (!password) {
      strengthBar.style.width = '0%';
      strengthBar.style.backgroundColor = '#dc2626';
      strengthText.textContent = 'Weak';
      strengthBarWrap.setAttribute('aria-valuenow', '0');
      return;
    }

    let score = 0;
    if (rules.length) score += 1;
    if (rules.uppercase) score += 1;
    if (rules.lowercase) score += 1;
    if (rules.number) score += 1;
    if (rules.special) score += 1;
    if (password.length >= 12) score += 1;

    let label = 'Weak';
    let width = 34;
    let color = '#dc2626';
    if (score >= 5) {
      label = 'Strong';
      width = 100;
      color = '#16a34a';
    } else if (score >= 3) {
      label = 'Medium';
      width = 68;
      color = '#d97706';
    }

    strengthText.textContent = label;
    strengthBar.style.width = `${width}%`;
    strengthBar.style.backgroundColor = color;
    strengthBarWrap.setAttribute('aria-valuenow', String(width));
  };

  const validateFullName = () => {
    const value = fullNameInput.value.trim().replace(/\s+/g, ' ');
    if (!value) {
      markFieldState(fullNameInput, 'full_name', false, 'Please enter your legal full name.');
      return false;
    }

    const parts = value.split(' ');
    const namePartPattern = /^[A-Za-z]+(?:['-][A-Za-z]+)*$/;
    const hasTwoNames = parts.length >= 2;
    const allValidParts = parts.every((part) => namePartPattern.test(part));

    if (!hasTwoNames || !allValidParts || value.length < 5) {
      markFieldState(fullNameInput, 'full_name', false, 'Use at least first and last name with letters only.');
      return false;
    }

    markFieldState(fullNameInput, 'full_name', true, 'Name looks valid.');
    return true;
  };

  const validateEmail = () => {
    const value = emailInput.value.trim().toLowerCase();
    if (!value) {
      markFieldState(emailInput, 'email', false, 'Please enter your real email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(value) || value.includes('..')) {
      markFieldState(emailInput, 'email', false, 'Enter a valid email format (example: name@example.com).');
      return false;
    }

    if (isLikelyTemporaryEmail(value)) {
      markFieldState(emailInput, 'email', false, 'Temporary email domains are not accepted.');
      return false;
    }

    markFieldState(emailInput, 'email', true, 'Email looks good.');
    return true;
  };

  const getPasswordRules = () => {
    const value = passwordInput.value;
    return {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /\d/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>_\-[\]\\/~`+=;]/.test(value),
    };
  };

  const validatePassword = () => {
    const value = passwordInput.value;
    const rules = getPasswordRules();
    updatePasswordChecklist(rules);
    updatePasswordStrength(value, rules);

    if (!value) {
      markFieldState(passwordInput, 'password', false, 'Please create a strong password.');
      return false;
    }

    const allPassed = Object.values(rules).every(Boolean);
    if (!allPassed) {
      markFieldState(passwordInput, 'password', false, 'Password does not meet all required rules.');
      return false;
    }

    markFieldState(passwordInput, 'password', true, 'Strong password detected.');
    return true;
  };

  const validateConfirmPassword = () => {
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!confirm) {
      markFieldState(confirmInput, 'confirm', false, 'Please confirm your password.');
      return false;
    }

    if (password !== confirm) {
      markFieldState(confirmInput, 'confirm', false, 'Passwords do not match.');
      return false;
    }

    markFieldState(confirmInput, 'confirm', true, 'Passwords match.');
    return true;
  };

  fullNameInput.addEventListener('input', validateFullName);
  fullNameInput.addEventListener('blur', validateFullName);
  emailInput.addEventListener('input', validateEmail);
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('input', () => {
    validatePassword();
    if (confirmInput.value) validateConfirmPassword();
  });
  passwordInput.addEventListener('blur', validatePassword);
  confirmInput.addEventListener('input', validateConfirmPassword);
  confirmInput.addEventListener('blur', validateConfirmPassword);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');

    const isNameValid = validateFullName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmValid = validateConfirmPassword();

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      showAlert('Please correct the highlighted fields before continuing.', 'error');
      form.querySelector('.is-invalid')?.focus();
      return;
    }

    const full_name = fullNameInput.value.trim().replace(/\s+/g, ' ');
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

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
