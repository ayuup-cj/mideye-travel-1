/**
 * Mideye – Cargo Estimated Price Calculator
 * Computes shipping cost from route type (domestic/international) and weight.
 */

const CARGO_RATES = {
  domestic: {
    label: 'Domestic',
    tiers: [
      { max: 10,  rate: 2.50, base: 5,  label: '0–10 kg' },
      { max: 50,  rate: 2.00, base: 5,  label: '10–50 kg' },
      { max: Infinity, rate: 1.50, base: 5, label: '50+ kg' },
    ],
  },
  international: {
    label: 'International',
    tiers: [
      { max: 10,  rate: 5.00, base: 15, label: '0–10 kg' },
      { max: 50,  rate: 4.00, base: 15, label: '10–50 kg' },
      { max: Infinity, rate: 3.00, base: 15, label: '50+ kg' },
    ],
  },
};

/** Return the pricing tier for a given weight. */
const getWeightTier = (weight, routeType) => {
  const tiers = CARGO_RATES[routeType].tiers;
  if (weight <= 10)  return tiers[0];
  if (weight <= 50)  return tiers[1];
  return tiers[2];
};

/** Calculate total: (weight × rate/kg) + base fee. */
const calculateCargoPrice = (weight, routeType) => {
  const tier = getWeightTier(weight, routeType);
  const total = weight * tier.rate + tier.base;
  return { tier, total };
};

const formatMoney = (amount) => `$${amount.toFixed(2)}`;

const initCargoPricing = () => {
  const calcBtn      = document.getElementById('calculatePriceBtn');
  const weightInput  = document.getElementById('cargoWeight');
  const resultBox    = document.getElementById('priceResult');
  const resultValue  = document.getElementById('priceResultValue');
  const resultBreak  = document.getElementById('priceResultBreakdown');
  const errorEl      = document.getElementById('priceCalcError');
  const routeBtns    = document.querySelectorAll('.route-type-btn');

  if (!calcBtn || !weightInput) return;

  let selectedRoute = 'domestic';

  // Route type toggle
  routeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      routeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRoute = btn.dataset.route;
      resultBox?.classList.remove('is-visible');
      errorEl?.classList.remove('is-visible');
    });
  });

  const runCalculation = () => {
    const weight = parseFloat(weightInput.value);
    errorEl?.classList.remove('is-visible');
    resultBox?.classList.remove('is-visible');

    if (!weight || weight <= 0) {
      errorEl.textContent = 'Please enter a valid weight in the Cargo Details section.';
      errorEl?.classList.add('is-visible');
      return;
    }

    const { tier, total } = calculateCargoPrice(weight, selectedRoute);
    const routeLabel = CARGO_RATES[selectedRoute].label;

    resultValue.textContent = formatMoney(total);
    resultBreak.textContent =
      `${routeLabel} · ${tier.label} · ${formatMoney(tier.rate)}/kg × ${weight} kg + ${formatMoney(tier.base)} base fee`;
    resultBox?.classList.add('is-visible');
  };

  calcBtn.addEventListener('click', runCalculation);

  // Re-calculate when weight changes if a result is already shown
  weightInput.addEventListener('input', () => {
    if (resultBox?.classList.contains('is-visible')) runCalculation();
  });

  // Clear price result on form reset
  document.getElementById('cargoRequestForm')?.addEventListener('reset', () => {
    resultBox?.classList.remove('is-visible');
    errorEl?.classList.remove('is-visible');
    routeBtns.forEach((b) => b.classList.remove('active'));
    document.getElementById('routeDomestic')?.classList.add('active');
    selectedRoute = 'domestic';
  });
};

document.addEventListener('DOMContentLoaded', initCargoPricing);
