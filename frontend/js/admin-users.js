/**
 * Mideye Admin – Users Management + Profile Modal
 * Enriches API users with demo stats; opens detail modal on View Details.
 */

// ─── Demo enrichment (merged with API data) ───────────────────────────────────
const DEMO_USER_EXTRAS = {
  1: {
    city: 'Galkacyo, Somalia',
    address: 'Garsoor District, Galkacyo',
    status: 'Active',
    last_login: 'Jun 7, 2026 · 3:42 PM',
    payment_method: 'EVC Plus',
    bookings_total: 340,
    cargo_count: 5,
    recent_bookings: [
      { route: 'GLK → MGQ', date: 'May 28, 2026', amount: 85, status: 'Confirmed' },
      { route: 'MGQ → HGA', date: 'Apr 12, 2026', amount: 120, status: 'Completed' },
      { route: 'GLK → KSM', date: 'Mar 3, 2026', amount: 135, status: 'Completed' },
    ],
    recent_cargo: [
      { id: 'MDY-0003', route: 'GLK → MGQ', date: 'Jun 1, 2026', status: 'In Transit' },
      { id: 'MDY-0001', route: 'GLK → HGA', date: 'May 10, 2026', status: 'Arrived' },
    ],
  },
  2: {
    city: 'Mogadishu, Somalia',
    address: 'Hodan District, Mogadishu',
    status: 'Active',
    last_login: 'Jun 8, 2026 · 9:15 AM',
    payment_method: 'Hormuud Pay',
    bookings_total: 195,
    cargo_count: 2,
    recent_bookings: [
      { route: 'MGQ → GLK', date: 'Jun 5, 2026', amount: 78, status: 'Pending' },
      { route: 'MGQ → BDI', date: 'Feb 20, 2026', amount: 92, status: 'Completed' },
    ],
    recent_cargo: [
      { id: 'MID-2026-001456', route: 'GLK → MGQ', date: 'Jan 15, 2026', status: 'In Transit' },
    ],
  },
  3: {
    city: 'Hargeisa, Somalia',
    address: '26 June District',
    status: 'Inactive',
    last_login: 'Apr 22, 2026 · 11:00 AM',
    payment_method: 'Cash on Delivery',
    bookings_total: 0,
    cargo_count: 1,
    recent_bookings: [],
    recent_cargo: [
      { id: 'ME-CG-20260519-FJ4Z', route: 'HGA → GLK', date: 'May 18, 2026', status: 'Arrived' },
    ],
  },
};

// Default extras for users without demo entry
const defaultExtras = (user) => ({
  city: 'Galkacyo, Somalia',
  address: '—',
  status: 'Active',
  last_login: '—',
  payment_method: 'EVC Plus',
  bookings_total: 0,
  cargo_count: 0,
  recent_bookings: [],
  recent_cargo: [],
});

/** Build full profile from API user + bookings/cargo + demo extras */
const buildUserProfile = (user, allBookings = [], allCargo = []) => {
  const extra = { ...defaultExtras(user), ...(DEMO_USER_EXTRAS[user.id] || {}) };

  const userBookings = allBookings.filter((b) => b.user_id === user.id);
  const userCargo    = allCargo.filter((c) => c.user_id === user.id);

  const computedBookingTotal = userBookings.reduce((sum, b) => {
    const base = b.cabin_class === 'business' ? 195 : 85;
    return sum + base * (b.adults || 1);
  }, 0);

  const bookingsTotal = extra.bookings_total || computedBookingTotal;
  const cargoCount    = extra.cargo_count || userCargo.length;

  const recentBookings = extra.recent_bookings.length
    ? extra.recent_bookings
    : userBookings.slice(0, 3).map((b) => ({
        route: `${b.origin} → ${b.destination}`,
        date: b.travel_date ? new Date(b.travel_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        amount: b.cabin_class === 'business' ? 195 : 85,
        status: b.status,
      }));

  const recentCargo = extra.recent_cargo.length
    ? extra.recent_cargo
    : userCargo.slice(0, 3).map((c) => ({
        id: c.tracking_id,
        route: `${c.origin || 'GLK'} → ${c.destination}`,
        date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        status: c.status,
      }));

  return {
    ...user,
    city: user.city || extra.city,
    address: extra.address,
    status: user.status || extra.status,
    last_login: extra.last_login,
    payment_method: extra.payment_method,
    bookings_total: bookingsTotal,
    cargo_count: cargoCount,
    recent_bookings: recentBookings,
    recent_cargo: recentCargo,
  };
};

let activeProfileUser = null;

// ─── Status badge ─────────────────────────────────────────────────────────────
const statusBadge = (status) => {
  const cls = status === 'Active' ? 'badge-active' : 'badge-inactive';
  return `<span class="badge-status ${cls}">${status}</span>`;
};

const bookingStatusMini = (s) => {
  const map = { Pending: 'pending', Confirmed: 'confirmed', Completed: 'completed', Cancelled: 'cancelled' };
  return `<span class="badge-status badge-${map[s] || 'pending'}" style="font-size:0.65rem;padding:0.2rem 0.5rem;">${s}</span>`;
};

const cargoStatusMini = (s) => {
  const map = { Received: 'received', 'In Transit': 'in-transit', Arrived: 'arrived' };
  return `<span class="badge-status badge-${map[s] || 'received'}" style="font-size:0.65rem;padding:0.2rem 0.5rem;">${s}</span>`;
};

// ─── Render enhanced users table ─────────────────────────────────────────────
window.renderEnhancedUsers = function (users, allBookings, allCargo, esc, fmtDate, roleBadge) {
  const tbody = document.getElementById('users-body');
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="table-empty"><i class="fas fa-users"></i>No users found.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = users.map((u, i) => {
    const p = buildUserProfile(u, allBookings, allCargo);
    const initial = (u.full_name || '?')[0].toUpperCase();

    return `
      <tr data-user-id="${u.id}">
        <td class="td-muted">${i + 1}</td>
        <td>
          <div class="user-cell">
            <div class="user-avatar-sm">${initial}</div>
            <div>
              <div class="user-cell-name">${esc(u.full_name)}</div>
              <div class="user-cell-email">${esc(u.email)}</div>
            </div>
          </div>
        </td>
        <td class="td-muted">${esc(u.phone || '–')}</td>
        <td class="td-muted">${esc(p.city)}</td>
        <td>${roleBadge(u.role)}</td>
        <td class="td-amount">$${p.bookings_total.toLocaleString()}</td>
        <td class="td-count">${p.cargo_count}</td>
        <td>${statusBadge(p.status)}</td>
        <td class="td-muted">${fmtDate(u.created_at)}</td>
        <td>
          <div class="actions-group">
            <button class="btn-action btn-action-gold" onclick="openUserProfileModal(${u.id})" title="View Details">
              <i class="fas fa-user-circle"></i> Profile
            </button>
            ${u.role !== 'admin' ? `
              <button class="btn-action btn-action-red" onclick="deleteUser(${u.id}, '${esc(u.full_name).replace(/'/g, "\\'")}')" title="Delete">
                <i class="fas fa-trash-alt"></i>
              </button>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');
};

// ─── Open profile modal ───────────────────────────────────────────────────────
window.openUserProfileModal = function (userId) {
  const user = (window.allUsers || []).find((u) => u.id === userId);
  if (!user) return;

  const p = buildUserProfile(user, window.allBookings || [], window.allCargo || []);
  activeProfileUser = p;

  const modal = document.getElementById('userProfileModal');
  const body  = document.getElementById('userProfileBody');
  if (!modal || !body) return;

  const initial = (p.full_name || '?')[0].toUpperCase();

  const bookingsHtml = p.recent_bookings.length
    ? p.recent_bookings.map((b) => `
        <div class="user-history-item">
          <div>
            <div class="user-history-item__main">${b.route}</div>
            <div class="user-history-item__sub">${b.date}</div>
          </div>
          <div class="user-history-item__meta">
            <div class="td-amount" style="font-size:0.85rem;">$${b.amount}</div>
            ${bookingStatusMini(b.status)}
          </div>
        </div>`).join('')
    : '<div class="user-history-empty"><i class="fas fa-plane"></i> No bookings yet</div>';

  const cargoHtml = p.recent_cargo.length
    ? p.recent_cargo.map((c) => `
        <div class="user-history-item">
          <div>
            <div class="user-history-item__main">${c.id}</div>
            <div class="user-history-item__sub">${c.route} · ${c.date}</div>
          </div>
          <div class="user-history-item__meta">${cargoStatusMini(c.status)}</div>
        </div>`).join('')
    : '<div class="user-history-empty"><i class="fas fa-box"></i> No cargo shipments yet</div>';

  document.getElementById('userModalName').textContent  = p.full_name;
  document.getElementById('userModalEmail').textContent = p.email;
  document.getElementById('userModalAvatar').textContent = initial;

  body.innerHTML = `
    <div class="user-modal__section">
      <div class="user-modal__section-title"><i class="fas fa-id-card"></i> Profile Details</div>
      <div class="user-profile-grid">
        <div class="user-profile-item">
          <div class="user-profile-item__label">Full Name</div>
          <div class="user-profile-item__value">${p.full_name}</div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">Email</div>
          <div class="user-profile-item__value">${p.email}</div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">Phone</div>
          <div class="user-profile-item__value">${p.phone || '–'}</div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">City / Address</div>
          <div class="user-profile-item__value">${p.city}<br><span style="font-weight:500;font-size:0.82rem;color:rgba(68,19,6,0.55);">${p.address}</span></div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">Role</div>
          <div class="user-profile-item__value" style="text-transform:capitalize;">${p.role}</div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">Status</div>
          <div class="user-profile-item__value">${statusBadge(p.status)}</div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">Joined Date</div>
          <div class="user-profile-item__value">${p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '–'}</div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">Last Login</div>
          <div class="user-profile-item__value">${p.last_login}</div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">Total Bookings</div>
          <div class="user-profile-item__value" style="font-family:'Cormorant Garamond',serif;font-size:1.35rem;">$${p.bookings_total.toLocaleString()}</div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">Total Cargo Shipments</div>
          <div class="user-profile-item__value" style="font-family:'Cormorant Garamond',serif;font-size:1.35rem;">${p.cargo_count}</div>
        </div>
        <div class="user-profile-item">
          <div class="user-profile-item__label">Payment Method</div>
          <div class="user-profile-item__value">${p.payment_method}</div>
        </div>
      </div>
    </div>

    <div class="user-modal__section">
      <div class="user-modal__section-title"><i class="fas fa-plane-departure"></i> Recent Bookings</div>
      <div class="user-history-list">${bookingsHtml}</div>
    </div>

    <div class="user-modal__section">
      <div class="user-modal__section-title"><i class="fas fa-box"></i> Recent Cargo</div>
      <div class="user-history-list">${cargoHtml}</div>
    </div>

    <div class="user-modal__actions" id="userModalActions">
      <button type="button" class="user-modal__btn user-modal__btn--primary" onclick="userModalAction('edit')">
        <i class="fas fa-edit"></i> Edit Profile
      </button>
      <button type="button" class="user-modal__btn user-modal__btn--gold" onclick="userModalAction('role')">
        <i class="fas fa-user-shield"></i> Change Role
      </button>
      ${p.status === 'Active'
        ? `<button type="button" class="user-modal__btn user-modal__btn--danger" onclick="userModalAction('deactivate')"><i class="fas fa-ban"></i> Deactivate Account</button>`
        : `<button type="button" class="user-modal__btn user-modal__btn--success" onclick="userModalAction('activate')"><i class="fas fa-check"></i> Activate Account</button>`
      }
      <button type="button" class="user-modal__btn user-modal__btn--outline" onclick="userModalAction('cargo')">
        <i class="fas fa-box-open"></i> View All Cargo
      </button>
    </div>`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeUserProfileModal = function () {
  const modal = document.getElementById('userProfileModal');
  modal?.classList.remove('open');
  document.body.style.overflow = '';
  activeProfileUser = null;
};

const getAdminApiBase = () => window.__ADMIN_API__ || 'http://localhost:5000/api';

const patchAdminUser = async (userId, body) => {
  const token = localStorage.getItem('mideye_token');
  const res = await fetch(`${getAdminApiBase()}/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to update user.');
  }
  return data.data.user;
};

const syncUpdatedUser = (updatedUser) => {
  const list = window.allUsers || [];
  const idx = list.findIndex((u) => u.id === updatedUser.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...updatedUser };
  window.allUsers = list;
};

const refreshUsersTable = () => {
  window.renderEnhancedUsers?.(
    window.allUsers,
    window.allBookings,
    window.allCargo,
    window.esc,
    window.fmtDate,
    window.roleBadge
  );
};

const renderUserActionPanel = (html) => {
  const panel = document.getElementById('userModalActions');
  if (panel) panel.innerHTML = html;
};

const restoreUserActionButtons = () => {
  if (!activeProfileUser) return;
  openUserProfileModal(activeProfileUser.id);
};

const showUserEditForm = () => {
  if (!activeProfileUser) return;
  const p = activeProfileUser;
  renderUserActionPanel(`
    <div class="user-action-panel">
      <div class="user-action-panel__title"><i class="fas fa-edit"></i> Edit Profile</div>
      <div class="user-action-form">
        <label class="user-action-form__label" for="editFullName">Full Name</label>
        <input id="editFullName" class="user-action-form__input" type="text" value="${window.esc(p.full_name)}" />
        <label class="user-action-form__label" for="editEmail">Email</label>
        <input id="editEmail" class="user-action-form__input" type="email" value="${window.esc(p.email)}" />
        <label class="user-action-form__label" for="editPhone">Phone</label>
        <input id="editPhone" class="user-action-form__input" type="tel" value="${window.esc(p.phone || '')}" />
        <label class="user-action-form__label" for="editCity">City</label>
        <input id="editCity" class="user-action-form__input" type="text" value="${window.esc(p.city || '')}" placeholder="e.g. Galkacyo, Somalia" />
      </div>
      <div class="user-action-panel__btns">
        <button type="button" class="user-modal__btn user-modal__btn--outline" onclick="restoreUserActionButtons()">Cancel</button>
        <button type="button" class="user-modal__btn user-modal__btn--primary" onclick="saveUserProfileEdits()">
          <i class="fas fa-save"></i> Save Changes
        </button>
      </div>
    </div>
  `);
};

const showUserRoleForm = () => {
  if (!activeProfileUser) return;
  const p = activeProfileUser;
  const isSelf = String(window.__ADMIN_USER_ID__ || '') === String(p.id);
  renderUserActionPanel(`
    <div class="user-action-panel">
      <div class="user-action-panel__title"><i class="fas fa-user-shield"></i> Change Role</div>
      <p class="user-action-panel__hint">Current role: <strong style="text-transform:capitalize;">${window.esc(p.role)}</strong></p>
      <select id="editUserRole" class="user-action-form__input" ${isSelf ? 'disabled' : ''}>
        <option value="user" ${p.role === 'user' ? 'selected' : ''}>User</option>
        <option value="admin" ${p.role === 'admin' ? 'selected' : ''}>Admin</option>
      </select>
      ${isSelf ? '<p class="user-action-panel__hint">You cannot change your own role.</p>' : ''}
      <div class="user-action-panel__btns">
        <button type="button" class="user-modal__btn user-modal__btn--outline" onclick="restoreUserActionButtons()">Cancel</button>
        <button type="button" class="user-modal__btn user-modal__btn--gold" onclick="saveUserRoleChange()" ${isSelf ? 'disabled' : ''}>
          <i class="fas fa-check"></i> Update Role
        </button>
      </div>
    </div>
  `);
};

window.saveUserProfileEdits = async function () {
  if (!activeProfileUser) return;
  const btn = document.querySelector('.user-action-panel__btns .user-modal__btn--primary');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
  }
  try {
    const updated = await patchAdminUser(activeProfileUser.id, {
      full_name: document.getElementById('editFullName')?.value.trim(),
      email: document.getElementById('editEmail')?.value.trim(),
      phone: document.getElementById('editPhone')?.value.trim(),
      city: document.getElementById('editCity')?.value.trim(),
    });
    syncUpdatedUser(updated);
    refreshUsersTable();
    window.showToast?.('Profile updated successfully', 'fa-check-circle');
    openUserProfileModal(updated.id);
  } catch (error) {
    window.showToast?.(error.message, 'fa-times-circle');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  }
};

window.saveUserRoleChange = async function () {
  if (!activeProfileUser) return;
  const newRole = document.getElementById('editUserRole')?.value;
  if (!newRole || newRole === activeProfileUser.role) {
    restoreUserActionButtons();
    return;
  }
  try {
    const updated = await patchAdminUser(activeProfileUser.id, { role: newRole });
    syncUpdatedUser(updated);
    refreshUsersTable();
    window.showToast?.(`Role updated to "${newRole}"`, 'fa-user-shield');
    openUserProfileModal(updated.id);
  } catch (error) {
    window.showToast?.(error.message, 'fa-times-circle');
  }
};

window.restoreUserActionButtons = restoreUserActionButtons;

window.userModalAction = async function (action) {
  if (!activeProfileUser) return;
  const name = activeProfileUser.full_name;

  switch (action) {
    case 'edit':
      showUserEditForm();
      break;
    case 'role':
      showUserRoleForm();
      break;
    case 'deactivate':
      if (!confirm(`Deactivate account for "${name}"? They will not be able to sign in.`)) return;
      try {
        const updated = await patchAdminUser(activeProfileUser.id, { status: 'Inactive' });
        syncUpdatedUser(updated);
        refreshUsersTable();
        window.showToast?.(`Account "${name}" deactivated`, 'fa-ban');
        closeUserProfileModal();
      } catch (error) {
        window.showToast?.(error.message, 'fa-times-circle');
      }
      break;
    case 'activate':
      try {
        const updated = await patchAdminUser(activeProfileUser.id, { status: 'Active' });
        syncUpdatedUser(updated);
        refreshUsersTable();
        window.showToast?.(`Account "${name}" activated`, 'fa-check-circle');
        closeUserProfileModal();
      } catch (error) {
        window.showToast?.(error.message, 'fa-times-circle');
      }
      break;
    case 'cargo': {
      const userId = activeProfileUser.id;
      const userName = activeProfileUser.full_name;
      closeUserProfileModal();
      window.navigate?.('cargo', document.querySelector('[data-section=cargo]'));
      window.filterCargoByUser?.(userId, userName);
      break;
    }
    default:
      break;
  }
};

// ─── Init: close on overlay / Esc ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('userProfileModal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeUserProfileModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) {
      closeUserProfileModal();
    }
  });
});
