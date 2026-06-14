/**
 * Registration UX Enhancements
 * - Real-time field validation
 * - Password strength and requirements checks
 * - Password visibility toggles
 * - Exposes validateBeforeSubmit() for api.js
 */
(function registerEnhancements() {
  'use strict';

  const form = document.getElementById('registerForm');
  if (!form) return;

  const fullNameInput = document.getElementById('regFullName');
  const emailInput = document.getElementById('regEmail');
  const passwordInput = document.getElementById('regPassword');
  const confirmInput = document.getElementById('regConfirm');

  if (!fullNameInput || !emailInput || !passwordInput || !confirmInput) return;

  const feedbackEls = {
    full_name: document.getElementById('fullNameFeedback'),
    email: document.getElementById('emailFeedback'),
    password: document.getElementById('passwordFeedback'),
    confirm: document.getElementById('confirmFeedback'),
  };

  const statusEls = {
    full_name: document.getElementById('fullNameStatus'),
    email: document.getElementById('emailStatus'),
    password: document.getElementById('passwordStatus'),
    confirm: document.getElementById('confirmStatus'),
  };

  const strengthFill = document.getElementById('passwordStrengthFill');
  const strengthText = document.getElementById('strengthText');
  const requirementEls = {};
  form.querySelectorAll('.password-rule[data-rule]').forEach((item) => {
    requirementEls[item.dataset.rule] = item;
  });

  const temporaryDomains = new Set([
    '10minutemail.com',
    'mailinator.com',
    'guerrillamail.com',
    'yopmail.com',
    'temp-mail.org',
    'tempmail.com',
    'dispostable.com',
    'fakeinbox.com',
    'trashmail.com',
    'getnada.com',
    'sharklasers.com',
  ]);

  const temporaryPattern = /(temp|mailinator|guerrilla|10minute|yopmail|trash|discard|fake)/i;

  const setFieldState = (input, feedbackEl, statusEl, state, message) => {
    input.classList.remove('is-valid', 'is-invalid');
    feedbackEl.classList.remove('feedback-success', 'feedback-error');

    if (state === 'valid') {
      input.classList.add('is-valid');
      feedbackEl.classList.add('feedback-success');
      feedbackEl.textContent = message || 'Looks good.';
      if (statusEl) statusEl.className = 'fas fa-circle-check input-status-icon';
      return;
    }

    if (state === 'invalid') {
      input.classList.add('is-invalid');
      feedbackEl.classList.add('feedback-error');
      feedbackEl.textContent = message || 'Please check this field.';
      if (statusEl) statusEl.className = 'fas fa-circle-exclamation input-status-icon';
      return;
    }

    feedbackEl.textContent = '';
    if (statusEl) statusEl.className = 'fas fa-circle-check input-status-icon';
  };

  const getPasswordChecks = (value) => ({
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  });

  const updatePasswordStrength = (value) => {
    const checks = getPasswordChecks(value);
    const metCount = Object.values(checks).filter(Boolean).length;

    let level = 'weak';
    let label = 'Strength: Weak';

    if (metCount >= 5 && value.length >= 10) {
      level = 'strong';
      label = 'Strength: Strong';
    } else if (metCount >= 3) {
      level = 'medium';
      label = 'Strength: Medium';
    }

    if (!value) {
      level = 'weak';
      label = 'Strength: Weak';
    }

    if (strengthFill) {
      strengthFill.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
      strengthFill.classList.add(`strength-${level}`);
    }
    if (strengthText) {
      strengthText.textContent = label;
    }

    Object.entries(checks).forEach(([ruleName, met]) => {
      const ruleEl = requirementEls[ruleName];
      if (!ruleEl) return;
      ruleEl.classList.toggle('met', met);
      const icon = ruleEl.querySelector('i');
      if (icon) icon.className = met ? 'fas fa-circle-check' : 'fas fa-circle';
    });

    return checks;
  };

  const validateFullName = () => {
    const value = fullNameInput.value.trim().replace(/\s+/g, ' ');

    if (!value) {
      setFieldState(fullNameInput, feedbackEls.full_name, statusEls.full_name, 'invalid', 'Real full name is required.');
      return false;
    }
    if (value.length < 5 || value.length > 100) {
      setFieldState(fullNameInput, feedbackEls.full_name, statusEls.full_name, 'invalid', 'Full name must be between 5 and 100 characters.');
      return false;
    }

    const parts = value.split(' ').filter(Boolean);
    if (parts.length < 2) {
      setFieldState(fullNameInput, feedbackEls.full_name, statusEls.full_name, 'invalid', 'Please enter at least first name and last name.');
      return false;
    }

    const legalNamePattern = /^[A-Za-z][A-Za-z' -]*[A-Za-z]$/;
    if (!legalNamePattern.test(value)) {
      setFieldState(fullNameInput, feedbackEls.full_name, statusEls.full_name, 'invalid', 'Use letters and standard name separators only.');
      return false;
    }

    fullNameInput.value = value;
    setFieldState(fullNameInput, feedbackEls.full_name, statusEls.full_name, 'valid', 'Full name looks valid.');
    return true;
  };

  const validateEmail = () => {
    const value = emailInput.value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!value) {
      setFieldState(emailInput, feedbackEls.email, statusEls.email, 'invalid', 'Real email address is required.');
      return false;
    }
    if (!emailRegex.test(value)) {
      setFieldState(emailInput, feedbackEls.email, statusEls.email, 'invalid', 'Please enter a valid email format.');
      return false;
    }

    const domain = value.split('@')[1] || '';
    if (temporaryDomains.has(domain) || temporaryPattern.test(domain)) {
      setFieldState(emailInput, feedbackEls.email, statusEls.email, 'invalid', 'Temporary/disposable emails are not allowed.');
      return false;
    }

    emailInput.value = value;
    setFieldState(emailInput, feedbackEls.email, statusEls.email, 'valid', 'Email address looks valid.');
    return true;
  };

  const validatePassword = () => {
    const value = passwordInput.value;
    const checks = updatePasswordStrength(value);
    const allMet = Object.values(checks).every(Boolean);

    if (!value) {
      setFieldState(passwordInput, feedbackEls.password, statusEls.password, 'invalid', 'Password is required.');
      return false;
    }
    if (!allMet) {
      setFieldState(passwordInput, feedbackEls.password, statusEls.password, 'invalid', 'Please meet all password requirements.');
      return false;
    }

    setFieldState(passwordInput, feedbackEls.password, statusEls.password, 'valid', 'Strong password confirmed.');
    return true;
  };

  const validateConfirmPassword = () => {
    const pass = passwordInput.value;
    const confirm = confirmInput.value;

    if (!confirm) {
      setFieldState(confirmInput, feedbackEls.confirm, statusEls.confirm, 'invalid', 'Please confirm your password.');
      return false;
    }
    if (pass !== confirm) {
      setFieldState(confirmInput, feedbackEls.confirm, statusEls.confirm, 'invalid', 'Passwords do not match.');
      return false;
    }

    setFieldState(confirmInput, feedbackEls.confirm, statusEls.confirm, 'valid', 'Passwords match.');
    return true;
  };

  const validateBeforeSubmit = () => {
    const validName = validateFullName();
    const validEmail = validateEmail();
    const validPassword = validatePassword();
    const validConfirm = validateConfirmPassword();

    if (!validName) {
      fullNameInput.focus();
      return false;
    }
    if (!validEmail) {
      emailInput.focus();
      return false;
    }
    if (!validPassword) {
      passwordInput.focus();
      return false;
    }
    if (!validConfirm) {
      confirmInput.focus();
      return false;
    }

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

  form.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-toggle-password');
      const target = document.getElementById(targetId);
      if (!target) return;

      const reveal = target.type === 'password';
      target.type = reveal ? 'text' : 'password';

      const icon = button.querySelector('i');
      if (icon) {
        icon.className = reveal ? 'fas fa-eye-slash' : 'fas fa-eye';
      }
      button.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
    });
  });

  updatePasswordStrength('');

  window.mideyeRegisterValidation = {
    validateBeforeSubmit,
  };
})();
