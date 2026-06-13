/**
 * Mideye Admin – Booking & Cargo Receipt Modals
 * Print + Save-as-PDF via browser print dialog.
 */

const RECEIPT_WHATSAPP = '+252907562038';

// ─── Demo enrichment per booking/cargo id ─────────────────────────────────────
const BOOKING_RECEIPT_EXTRAS = {
  default: {
    seat_number: '12A',
    payment_method: 'EVC Plus',
    payment_status: 'Paid',
  },
};

const CARGO_RECEIPT_EXTRAS = {
  default: {
    description: 'General cargo shipment',
    payment_method: 'Hormuud Pay',
    payment_status: 'Paid',
  },
};

const CITY_NAMES = {
  GLK: 'Galkacyo', MGQ: 'Mogadishu', HGA: 'Hargeisa', KSM: 'Kismayo', BDI: 'Baidoa',
};

const fmtReceiptDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
  });
};

const fmtGenerated = () =>
  new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const calcBookingPrice = (b) => {
  const base = b.cabin_class === 'business' ? 195 : 85;
  const pax = (b.adults || 1) + (b.children || 0);
  return base * Math.max(pax, 1);
};

const calcCargoPrice = (c) => {
  const w = parseFloat(c.weight) || 0;
  if (w <= 10) return w * 2.5 + 5;
  if (w <= 50) return w * 2.0 + 5;
  return w * 1.5 + 5;
};

const paymentStatusFromBooking = (status) => {
  if (status === 'Confirmed' || status === 'Completed') return { label: 'Paid', confirmed: true };
  if (status === 'Cancelled') return { label: 'Refunded', confirmed: false };
  return { label: 'Pending', confirmed: false };
};

const paymentStatusFromCargo = (status) => {
  if (status === 'Arrived') return { label: 'Paid', confirmed: true };
  if (status === 'Cancelled') return { label: 'Refunded', confirmed: false };
  return { label: 'Pending', confirmed: false };
};

// ─── Simple barcode SVG ────────────────────────────────────────────────────────
const generateBarcodeSVG = (code) => {
  const bars = code.split('').map((ch, i) => {
    const w = (ch.charCodeAt(0) % 3) + 1;
    const h = 30 + (ch.charCodeAt(0) % 15);
    return `<rect x="${i * 4}" y="${40 - h}" width="${w}" height="${h}" fill="#441306"/>`;
  }).join('');
  const width = code.length * 4 + 10;
  return `<svg viewBox="0 0 ${width} 44" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
};

// ─── Simple QR pattern on canvas ─────────────────────────────────────────────
const drawQRPattern = (canvas, text) => {
  const ctx = canvas.getContext('2d');
  const size = 72;
  canvas.width = size;
  canvas.height = size;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);

  const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cell = 6;
  const cells = size / cell;

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const hash = (r * 17 + c * 31 + seed) % 7;
      if (hash < 3 || (r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3)) {
        ctx.fillStyle = '#441306';
        ctx.fillRect(c * cell, r * cell, cell - 1, cell - 1);
      }
    }
  }
};

// ─── Build receipt HTML ────────────────────────────────────────────────────────
const buildBookingReceiptHTML = (b) => {
  const extra = BOOKING_RECEIPT_EXTRAS[b.id] || BOOKING_RECEIPT_EXTRAS.default;
  const pay = paymentStatusFromBooking(b.status);
  const ref = `BK-${new Date(b.created_at || Date.now()).getFullYear()}-${String(b.id).padStart(5, '0')}`;
  const route = `${CITY_NAMES[b.origin] || b.origin} → ${CITY_NAMES[b.destination] || b.destination}`;
  const total = calcBookingPrice(b);
  const seat = b.seat_preference || extra.seat_number;

  return `
    <div class="receipt-doc" id="receiptPrintArea">
      <div class="receipt-doc__header">
        <div class="receipt-doc__logo"><i class="fas fa-plane"></i></div>
        <div class="receipt-doc__brand">Mid<span>eye</span> Travel Agency</div>
        <div class="receipt-doc__tagline">Galkacyo, Somalia · Domestic Flights</div>
        <div class="receipt-doc__type-row">
          <span class="receipt-doc__type">Official Receipt</span>
          <span class="receipt-doc__confirmed ${pay.confirmed ? '' : 'pending'}">
            <i class="fas fa-${pay.confirmed ? 'check-circle' : 'clock'}"></i> ${b.status === 'Confirmed' || b.status === 'Completed' ? 'Confirmed' : b.status}
          </span>
        </div>
      </div>

      <div class="receipt-ref">
        <div class="receipt-ref__label">Booking Reference</div>
        <div class="receipt-ref__value">${ref}</div>
      </div>

      <div class="receipt-fields">
        <div class="receipt-field">
          <div class="receipt-field__label">Passenger</div>
          <div class="receipt-field__value">${b.passenger_name || '—'}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Seat Number</div>
          <div class="receipt-field__value">${seat}</div>
        </div>
        <div class="receipt-field receipt-field--full">
          <div class="receipt-field__label">Route</div>
          <div class="receipt-field__value">${route}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Travel Date</div>
          <div class="receipt-field__value">${fmtReceiptDate(b.travel_date)}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Class</div>
          <div class="receipt-field__value" style="text-transform:capitalize;">${b.cabin_class || 'Economy'}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Phone</div>
          <div class="receipt-field__value">${b.phone || '—'}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Email</div>
          <div class="receipt-field__value">${b.email || '—'}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Payment Method</div>
          <div class="receipt-field__value">${extra.payment_method}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Payment Status</div>
          <div class="receipt-field__value">${pay.label}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Passengers</div>
          <div class="receipt-field__value">${(b.adults||1)} Adult(s)${b.children ? `, ${b.children} Child(ren)` : ''}${b.infants ? `, ${b.infants} Infant(s)` : ''}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Trip Type</div>
          <div class="receipt-field__value" style="text-transform:capitalize;">${b.trip_type || 'One Way'}</div>
        </div>
      </div>

      <div class="receipt-total">
        <span class="receipt-total__label">Total Price</span>
        <span class="receipt-total__value">$${total.toFixed(2)}</span>
      </div>

      <div class="receipt-code-row">
        <div class="receipt-barcode">${generateBarcodeSVG(ref)}</div>
        <div class="receipt-qr"><canvas id="receiptQrCanvas"></canvas></div>
      </div>

      <div class="receipt-doc__footer">
        <div>Thank you for choosing <strong>MidEye Travel Agency</strong></div>
        <div>Contact WhatsApp: <a href="https://wa.me/252907562038" target="_blank" rel="noopener">${RECEIPT_WHATSAPP}</a></div>
        <div class="receipt-generated">Generated: ${fmtGenerated()}</div>
      </div>
    </div>`;
};

const buildCargoReceiptHTML = (c) => {
  const extra = CARGO_RECEIPT_EXTRAS[c.id] || CARGO_RECEIPT_EXTRAS.default;
  const pay = paymentStatusFromCargo(c.status);
  const route = `${CITY_NAMES[c.origin] || c.origin || 'GLK'} → ${CITY_NAMES[c.destination] || c.destination}`;
  const total = calcCargoPrice(c);
  const desc = c.description || extra.description;
  const ref = c.tracking_id;

  return `
    <div class="receipt-doc" id="receiptPrintArea">
      <div class="receipt-doc__header">
        <div class="receipt-doc__logo"><i class="fas fa-box"></i></div>
        <div class="receipt-doc__brand">Mid<span>eye</span> Travel Agency</div>
        <div class="receipt-doc__tagline">Galkacyo, Somalia · Cargo Shipping</div>
        <div class="receipt-doc__type-row">
          <span class="receipt-doc__type">Official Receipt</span>
          <span class="receipt-doc__confirmed ${pay.confirmed ? '' : 'pending'}">
            <i class="fas fa-${pay.confirmed ? 'check-circle' : 'clock'}"></i> ${c.status}
          </span>
        </div>
      </div>

      <div class="receipt-ref">
        <div class="receipt-ref__label">Tracking Number</div>
        <div class="receipt-ref__value">${ref}</div>
      </div>

      <div class="receipt-fields">
        <div class="receipt-field">
          <div class="receipt-field__label">Sender</div>
          <div class="receipt-field__value">${c.sender_name || '—'}<br><span style="font-weight:500;font-size:0.82rem;color:rgba(68,19,6,0.55);">${c.sender_phone || ''}</span></div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Receiver</div>
          <div class="receipt-field__value">${c.recipient_name || '—'}<br><span style="font-weight:500;font-size:0.82rem;color:rgba(68,19,6,0.55);">${c.recipient_phone || ''}</span></div>
        </div>
        <div class="receipt-field receipt-field--full">
          <div class="receipt-field__label">Route</div>
          <div class="receipt-field__value">${route}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Weight (kg)</div>
          <div class="receipt-field__value">${c.weight} kg</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Cargo Type</div>
          <div class="receipt-field__value" style="text-transform:capitalize;">${c.cargo_type || '—'}</div>
        </div>
        <div class="receipt-field receipt-field--full">
          <div class="receipt-field__label">Contents Description</div>
          <div class="receipt-field__value">${desc}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Shipping Speed</div>
          <div class="receipt-field__value" style="text-transform:capitalize;">${c.shipping_speed || 'Standard'}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Status</div>
          <div class="receipt-field__value">${c.status}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Payment Method</div>
          <div class="receipt-field__value">${extra.payment_method}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Payment Status</div>
          <div class="receipt-field__value">${pay.label}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Date</div>
          <div class="receipt-field__value">${fmtReceiptDate(c.created_at)}</div>
        </div>
        <div class="receipt-field">
          <div class="receipt-field__label">Pieces</div>
          <div class="receipt-field__value">${c.pieces || 1}</div>
        </div>
      </div>

      <div class="receipt-total">
        <span class="receipt-total__label">Shipment Price</span>
        <span class="receipt-total__value">$${total.toFixed(2)}</span>
      </div>

      <div class="receipt-code-row">
        <div class="receipt-barcode">${generateBarcodeSVG(ref)}</div>
        <div class="receipt-qr"><canvas id="receiptQrCanvas"></canvas></div>
      </div>

      <div class="receipt-doc__footer">
        <div>Thank you for shipping with <strong>MidEye Travel Agency</strong></div>
        <div>Contact WhatsApp: <a href="https://wa.me/252907562038" target="_blank" rel="noopener">${RECEIPT_WHATSAPP}</a></div>
        <div class="receipt-generated">Generated: ${fmtGenerated()}</div>
      </div>
    </div>`;
};

// ─── Modal controls ────────────────────────────────────────────────────────────
let activeReceiptRef = '';

const openReceiptModal = (html, ref, title) => {
  const modal = document.getElementById('receiptModal');
  const body  = document.getElementById('receiptModalBody');
  const titleEl = document.getElementById('receiptModalTitle');
  if (!modal || !body) return;

  activeReceiptRef = ref;
  if (titleEl) titleEl.textContent = title;
  body.innerHTML = html;

  const canvas = document.getElementById('receiptQrCanvas');
  if (canvas) drawQRPattern(canvas, ref);

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.openBookingReceipt = function (bookingId) {
  const booking = (window.allBookings || []).find((b) => b.id === bookingId);
  if (!booking) {
    window.showToast?.('Booking not found', 'fa-times-circle');
    return;
  }
  const ref = `BK-${new Date(booking.created_at || Date.now()).getFullYear()}-${String(booking.id).padStart(5, '0')}`;
  openReceiptModal(buildBookingReceiptHTML(booking), ref, 'Flight Booking Receipt');
};

window.openCargoReceipt = function (cargoId) {
  const cargo = (window.allCargo || []).find((c) => c.id === cargoId);
  if (!cargo) {
    window.showToast?.('Cargo shipment not found', 'fa-times-circle');
    return;
  }
  openReceiptModal(buildCargoReceiptHTML(cargo), cargo.tracking_id, 'Cargo Shipment Receipt');
};

window.closeReceiptModal = function () {
  document.getElementById('receiptModal')?.classList.remove('open');
  document.body.style.overflow = '';
  activeReceiptRef = '';
};

window.printReceipt = function () {
  window.print();
};

window.downloadReceiptPdf = function () {
  window.showToast?.('Use "Save as PDF" in the print dialog', 'fa-file-pdf');
  setTimeout(() => window.print(), 400);
};

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('receiptModal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeReceiptModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) {
      closeReceiptModal();
    }
  });
});
