/**
 * Mideye – Available Flights Search & Filter
 * Renders airline cards dynamically with real-time filtering.
 */

// ─── City lookup for display ───────────────────────────────────────────────────
const CITY_NAMES = {
  GLK: 'Galkacyo',
  MGQ: 'Mogadishu',
  HGA: 'Hargeisa',
  KSM: 'Kismayo',
  BDI: 'Baidoa',
};

// ─── Sample airline flight data ────────────────────────────────────────────────
const FLIGHTS_DATA = [
  {
    id: 'SA-101',
    airline: 'Somali Airlines',
    airlineSlug: 'somali-airlines',
    logoInitials: 'SA',
    logoGradient: 'linear-gradient(135deg, #441306, #8c3520)',
    departure: { code: 'GLK', time: '06:30' },
    arrival:   { code: 'MGQ', time: '07:45' },
    duration: '1h 15m',
    seats: 28,
    class: 'economy',
    price: 85,
    flightNo: 'SA 101',
  },
  {
    id: 'SA-204',
    airline: 'Somali Airlines',
    airlineSlug: 'somali-airlines',
    logoInitials: 'SA',
    logoGradient: 'linear-gradient(135deg, #441306, #8c3520)',
    departure: { code: 'MGQ', time: '09:00' },
    arrival:   { code: 'HGA', time: '10:30' },
    duration: '1h 30m',
    seats: 18,
    class: 'business',
    price: 195,
    flightNo: 'SA 204',
  },
  {
    id: 'DA-310',
    airline: 'Daallo Airlines',
    airlineSlug: 'daallo-airlines',
    logoInitials: 'DA',
    logoGradient: 'linear-gradient(135deg, #6b1e0d, #b85a40)',
    departure: { code: 'GLK', time: '08:15' },
    arrival:   { code: 'MGQ', time: '09:20' },
    duration: '1h 05m',
    seats: 32,
    class: 'economy',
    price: 78,
    flightNo: 'DA 310',
  },
  {
    id: 'DA-415',
    airline: 'Daallo Airlines',
    airlineSlug: 'daallo-airlines',
    logoInitials: 'DA',
    logoGradient: 'linear-gradient(135deg, #6b1e0d, #b85a40)',
    departure: { code: 'HGA', time: '14:00' },
    arrival:   { code: 'GLK', time: '15:10' },
    duration: '1h 10m',
    seats: 14,
    class: 'business',
    price: 210,
    flightNo: 'DA 415',
  },
  {
    id: 'FA-220',
    airline: 'Freedom Airline',
    airlineSlug: 'freedom-airline',
    logoInitials: 'FA',
    logoGradient: 'linear-gradient(135deg, #2c0b04, #6b1e0d)',
    departure: { code: 'GLK', time: '11:30' },
    arrival:   { code: 'KSM', time: '13:45' },
    duration: '2h 15m',
    seats: 22,
    class: 'economy',
    price: 120,
    flightNo: 'FA 220',
  },
  {
    id: 'FA-118',
    airline: 'Freedom Airline',
    airlineSlug: 'freedom-airline',
    logoInitials: 'FA',
    logoGradient: 'linear-gradient(135deg, #2c0b04, #6b1e0d)',
    departure: { code: 'MGQ', time: '16:45' },
    arrival:   { code: 'BDI', time: '18:00' },
    duration: '1h 15m',
    seats: 26,
    class: 'economy',
    price: 92,
    flightNo: 'FA 118',
  },
  {
    id: 'JA-505',
    airline: 'Jubba Airways',
    airlineSlug: 'jubba-airways',
    logoInitials: 'JA',
    logoGradient: 'linear-gradient(135deg, #8c3520, #fee685)',
    departure: { code: 'GLK', time: '13:00' },
    arrival:   { code: 'HGA', time: '14:25' },
    duration: '1h 25m',
    seats: 20,
    class: 'economy',
    price: 88,
    flightNo: 'JA 505',
  },
  {
    id: 'JA-612',
    airline: 'Jubba Airways',
    airlineSlug: 'jubba-airways',
    logoInitials: 'JA',
    logoGradient: 'linear-gradient(135deg, #8c3520, #fee685)',
    departure: { code: 'KSM', time: '07:30' },
    arrival:   { code: 'MGQ', time: '09:50' },
    duration: '2h 20m',
    seats: 16,
    class: 'business',
    price: 245,
    flightNo: 'JA 612',
  },
  {
    id: 'AE-330',
    airline: 'African Express',
    airlineSlug: 'african-express',
    logoInitials: 'AE',
    logoGradient: 'linear-gradient(135deg, #441306, #e8c945)',
    departure: { code: 'GLK', time: '17:20' },
    arrival:   { code: 'MGQ', time: '18:35' },
    duration: '1h 15m',
    seats: 30,
    class: 'economy',
    price: 82,
    flightNo: 'AE 330',
  },
  {
    id: 'AE-441',
    airline: 'African Express',
    airlineSlug: 'african-express',
    logoInitials: 'AE',
    logoGradient: 'linear-gradient(135deg, #441306, #e8c945)',
    departure: { code: 'BDI', time: '10:15' },
    arrival:   { code: 'HGA', time: '12:00' },
    duration: '1h 45m',
    seats: 12,
    class: 'business',
    price: 185,
    flightNo: 'AE 441',
  },
  {
    id: 'SA-308',
    airline: 'Somali Airlines',
    airlineSlug: 'somali-airlines',
    logoInitials: 'SA',
    logoGradient: 'linear-gradient(135deg, #441306, #8c3520)',
    departure: { code: 'HGA', time: '18:30' },
    arrival:   { code: 'MGQ', time: '20:00' },
    duration: '1h 30m',
    seats: 24,
    class: 'economy',
    price: 90,
    flightNo: 'SA 308',
  },
  {
    id: 'DA-522',
    airline: 'Daallo Airlines',
    airlineSlug: 'daallo-airlines',
    logoInitials: 'DA',
    logoGradient: 'linear-gradient(135deg, #6b1e0d, #b85a40)',
    departure: { code: 'GLK', time: '05:45' },
    arrival:   { code: 'BDI', time: '07:30' },
    duration: '1h 45m',
    seats: 19,
    class: 'economy',
    price: 95,
    flightNo: 'DA 522',
  },
];

// ─── DOM refs (set on init) ────────────────────────────────────────────────────
let els = {};

// ─── Filter state ──────────────────────────────────────────────────────────────
const getFilters = () => ({
  departure:   els.departure?.value   || '',
  destination: els.destination?.value || '',
  airline:     els.airline?.value     || '',
  classType:   els.classType?.value   || '',
  travelDate:  els.travelDate?.value  || '',
  search:      (els.search?.value || '').trim().toLowerCase(),
});

// ─── Match a flight against current filters ────────────────────────────────────
const flightMatches = (flight, filters) => {
  if (filters.departure && flight.departure.code !== filters.departure) return false;
  if (filters.destination && flight.arrival.code !== filters.destination) return false;
  if (filters.airline && flight.airlineSlug !== filters.airline) return false;
  if (filters.classType && flight.class !== filters.classType) return false;

  if (filters.search) {
    const haystack = [
      flight.airline,
      flight.flightNo,
      CITY_NAMES[flight.departure.code],
      CITY_NAMES[flight.arrival.code],
      flight.departure.code,
      flight.arrival.code,
      flight.class,
    ].join(' ').toLowerCase();
    if (!haystack.includes(filters.search)) return false;
  }

  return true;
};

// ─── Render helpers ────────────────────────────────────────────────────────────
const formatClass = (cls) => cls.charAt(0).toUpperCase() + cls.slice(1);

const seatsLabel = (n) => (n <= 5 ? `${n} left` : `${n} seats`);

const buildFlightCard = (flight, index) => {
  const depCity = CITY_NAMES[flight.departure.code] || flight.departure.code;
  const arrCity = CITY_NAMES[flight.arrival.code]   || flight.arrival.code;
  const lowSeats  = flight.seats <= 8;
  const classBadge = flight.class === 'business' ? 'business' : 'economy';

  return `
    <article class="flight-card" data-flight-id="${flight.id}" style="animation-delay:${index * 0.06}s">
      <div class="flight-card__header">
        <div class="flight-card__airline">
          <div class="flight-card__logo" style="background:${flight.logoGradient}">
            <span>${flight.logoInitials}</span>
          </div>
          <div class="flight-card__airline-info">
            <h3 class="flight-card__airline-name">${flight.airline}</h3>
            <span class="flight-card__flight-no">${flight.flightNo}</span>
          </div>
        </div>
        <span class="flight-card__class-badge ${classBadge}">
          <i class="fas ${flight.class === 'business' ? 'fa-crown' : 'fa-chair'}"></i>
          ${formatClass(flight.class)}
        </span>
      </div>

      <div class="flight-card__route">
        <div class="flight-card__endpoint">
          <time class="flight-card__time">${flight.departure.time}</time>
          <span class="flight-card__city">${depCity}</span>
          <span class="flight-card__code">${flight.departure.code}</span>
        </div>

        <div class="flight-card__journey">
          <span class="flight-card__duration">${flight.duration}</span>
          <div class="flight-card__line">
            <span class="flight-card__line-dot"></span>
            <span class="flight-card__line-track"></span>
            <i class="fas fa-plane flight-card__plane-icon"></i>
            <span class="flight-card__line-dot flight-card__line-dot--end"></span>
          </div>
          <span class="flight-card__direct">Direct</span>
        </div>

        <div class="flight-card__endpoint flight-card__endpoint--arrival">
          <time class="flight-card__time">${flight.arrival.time}</time>
          <span class="flight-card__city">${arrCity}</span>
          <span class="flight-card__code">${flight.arrival.code}</span>
        </div>
      </div>

      <div class="flight-card__footer">
        <div class="flight-card__meta">
          <span class="flight-card__seats ${lowSeats ? 'flight-card__seats--low' : ''}">
            <i class="fas fa-users"></i> ${seatsLabel(flight.seats)}
          </span>
        </div>
        <div class="flight-card__pricing">
          <span class="flight-card__price-label">From</span>
          <span class="flight-card__price">$${flight.price}</span>
        </div>
        <button type="button" class="flight-card__book-btn btn-primary-custom" data-book-flight="${flight.id}">
          <i class="fas fa-ticket-alt"></i>
          <span>Book Now</span>
        </button>
      </div>
    </article>`;
};

// ─── Show / hide loader ────────────────────────────────────────────────────────
let loadTimer = null;

const showLoader = () => {
  els.loader?.classList.add('is-visible');
  els.list?.classList.add('is-loading');
  els.empty?.classList.remove('is-visible');
};

const hideLoader = () => {
  els.loader?.classList.remove('is-visible');
  els.list?.classList.remove('is-loading');
};

// ─── Render filtered flights ───────────────────────────────────────────────────
const renderFlights = (withDelay = true) => {
  const filters = getFilters();

  if (loadTimer) clearTimeout(loadTimer);
  showLoader();

  const doRender = () => {
    const matched = FLIGHTS_DATA.filter((f) => flightMatches(f, filters));

    if (els.count) {
      els.count.textContent = matched.length
        ? `${matched.length} flight${matched.length !== 1 ? 's' : ''} found`
        : 'No flights found';
    }

    hideLoader();

    if (!matched.length) {
      els.list.innerHTML = '';
      els.empty?.classList.add('is-visible');
      return;
    }

    els.empty?.classList.remove('is-visible');
    els.list.innerHTML = matched.map(buildFlightCard).join('');
    bindBookButtons();
  };

  if (withDelay) {
    loadTimer = setTimeout(doRender, 480);
  } else {
    doRender();
  }
};

// ─── Pre-fill booking modal from selected flight ───────────────────────────────
const openBookingModal = (flightId) => {
  const flight = FLIGHTS_DATA.find((f) => f.id === flightId);
  if (!flight) return;

  const form = document.getElementById('flightBookingForm');
  if (!form) return;

  const selects = form.querySelectorAll('select');
  const dateInput = form.querySelector('input[type="date"]');

  // Route selects (first two selects in form)
  if (selects[0]) selects[0].value = flight.departure.code;
  if (selects[1]) selects[1].value = flight.arrival.code;

  // Cabin class radio
  const classRadio = form.querySelector(`input[name="cabinClass"][value="${flight.class}"]`);
  if (classRadio) classRadio.checked = true;

  // Travel date from filter or today
  const filters = getFilters();
  if (dateInput) {
    dateInput.value = filters.travelDate || new Date().toISOString().split('T')[0];
  }

  // Show selected flight summary in modal
  const summary = document.getElementById('selectedFlightSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="selected-flight-chip">
        <div class="selected-flight-chip__logo" style="background:${flight.logoGradient}">
          ${flight.logoInitials}
        </div>
        <div class="selected-flight-chip__info">
          <strong>${flight.airline}</strong> · ${flight.flightNo}
          <span>${CITY_NAMES[flight.departure.code]} → ${CITY_NAMES[flight.arrival.code]} · ${flight.departure.time} · ${formatClass(flight.class)} · <strong>$${flight.price}</strong></span>
        </div>
      </div>`;
    summary.classList.add('is-visible');
  }

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('bookingModal'));
  modal.show();

  // Scroll modal body to top
  document.querySelector('#bookingModal .modal-body')?.scrollTo(0, 0);
};

const bindBookButtons = () => {
  els.list?.querySelectorAll('[data-book-flight]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBookingModal(btn.dataset.bookFlight);
    });
  });

  els.list?.querySelectorAll('.flight-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-book-flight]')) return;
      const id = card.dataset.flightId;
      els.list.querySelectorAll('.flight-card').forEach((c) => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
    });
  });
};

// ─── Wire filter inputs ────────────────────────────────────────────────────────
const bindFilters = () => {
  const inputs = [
    els.departure,
    els.destination,
    els.airline,
    els.classType,
    els.travelDate,
    els.search,
  ].filter(Boolean);

  inputs.forEach((input) => {
    const event = input.type === 'text' ? 'input' : 'change';
    input.addEventListener(event, () => renderFlights());
  });

  els.resetBtn?.addEventListener('click', () => {
    if (els.departure)   els.departure.value   = '';
    if (els.destination) els.destination.value = '';
    if (els.airline)     els.airline.value     = '';
    if (els.classType)   els.classType.value   = '';
    if (els.travelDate)  els.travelDate.value  = '';
    if (els.search)      els.search.value      = '';
    renderFlights();
  });

  // Search flights button in old form area – scroll to results
  els.searchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('flightsResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderFlights();
  });
};

// ─── Set default travel date to today ──────────────────────────────────────────
const setDefaultDate = () => {
  if (els.travelDate && !els.travelDate.value) {
    els.travelDate.value = new Date().toISOString().split('T')[0];
    els.travelDate.min = new Date().toISOString().split('T')[0];
  }
};

// ─── Public init ───────────────────────────────────────────────────────────────
const initFlightsSearch = () => {
  els = {
    departure:   document.getElementById('filterDeparture'),
    destination: document.getElementById('filterDestination'),
    airline:     document.getElementById('filterAirline'),
    classType:   document.getElementById('filterClass'),
    travelDate:  document.getElementById('filterDate'),
    search:      document.getElementById('filterSearch'),
    resetBtn:    document.getElementById('filterReset'),
    searchBtn:   document.getElementById('searchFlightsBtn'),
    list:        document.getElementById('flightsList'),
    loader:      document.getElementById('flightsLoader'),
    empty:       document.getElementById('flightsEmpty'),
    count:       document.getElementById('flightsCount'),
  };

  if (!els.list) return;

  setDefaultDate();
  bindFilters();
  renderFlights(false);
};

document.addEventListener('DOMContentLoaded', initFlightsSearch);
