require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { connectDB, sequelize } = require('../config/database');
const { User, Booking, Cargo } = require('../models');

const SAMPLE_EMAIL_DOMAIN = '@sample.mideye.so';
const SAMPLE_PASSWORD = 'Sample@123';

const SAMPLE_USERS = [
  { full_name: 'Ahmed Hassan Ali', city: 'Mogadishu', phone: '+252 61 234 5601' },
  { full_name: 'Fatima Mohamed Abdi', city: 'Hargeisa', phone: '+252 63 234 5602' },
  { full_name: 'Yusuf Omar Ibrahim', city: 'Galkacyo', phone: '+252 61 234 5603' },
  { full_name: 'Amina Said Warsame', city: 'Bosaso', phone: '+252 90 234 5604' },
  { full_name: 'Mohamed Abdirahman Noor', city: 'Kismayo', phone: '+252 61 234 5605' },
  { full_name: 'Khadija Ali Muse', city: 'Baidoa', phone: '+252 63 234 5606' },
  { full_name: 'Hassan Abdi Farah', city: 'Mogadishu', phone: '+252 61 234 5607' },
  { full_name: 'Maryam Yusuf Jama', city: 'Hargeisa', phone: '+252 63 234 5608' },
  { full_name: 'Ibrahim Mohamed Hussein', city: 'Galkacyo', phone: '+252 61 234 5609' },
  { full_name: 'Sumaya Abdi Ahmed', city: 'Garowe', phone: '+252 90 234 5610' },
  { full_name: 'Omar Hassan Nur', city: 'Mogadishu', phone: '+252 61 234 5611' },
  { full_name: 'Halima Mohamed Dirie', city: 'Hargeisa', phone: '+252 63 234 5612' },
  { full_name: 'Abdirahman Ali Osman', city: 'Galkacyo', phone: '+252 61 234 5613' },
  { full_name: 'Sahra Hassan Abdi', city: 'Bosaso', phone: '+252 90 234 5614' },
  { full_name: 'Liban Omar Mohamud', city: 'Kismayo', phone: '+252 61 234 5615' },
  { full_name: 'Naima Yusuf Ali', city: 'Mogadishu', phone: '+252 63 234 5616' },
  { full_name: 'Cabdiqani Maxamed Faarax', city: 'Hargeisa', phone: '+252 61 234 5617' },
  { full_name: 'Ifrah Cabdullahi Maxamuud', city: 'Galkacyo', phone: '+252 90 234 5618' },
  { full_name: 'Daahir Maxamed Axmed', city: 'Baidoa', phone: '+252 61 234 5619' },
  { full_name: 'Zamzam Hassan Keyse', city: 'Mogadishu', phone: '+252 63 234 5620' },
];

const ROUTES = [
  { origin: 'MGQ', destination: 'HGA', from_city: 'Mogadishu', to_city: 'Hargeisa' },
  { origin: 'HGA', destination: 'MGQ', from_city: 'Hargeisa', to_city: 'Mogadishu' },
  { origin: 'GLK', destination: 'MGQ', from_city: 'Galkacyo', to_city: 'Mogadishu' },
  { origin: 'MGQ', destination: 'KMU', from_city: 'Mogadishu', to_city: 'Kismayo' },
  { origin: 'HGA', destination: 'GLK', from_city: 'Hargeisa', to_city: 'Galkacyo' },
  { origin: 'GLK', destination: 'BBO', from_city: 'Galkacyo', to_city: 'Baidoa' },
];

const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const CARGO_STATUSES = ['Received', 'In Transit', 'Arrived', 'Cancelled'];
const CARGO_TYPES = ['Documents', 'Electronics', 'Clothing', 'Food Items', 'Household Goods'];

const pad = (n) => String(n).padStart(2, '0');

const addDays = (baseDate, days) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const nextTrackingId = async (startIndex) => {
  const last = await Cargo.findOne({ order: [['id', 'DESC']] });
  let next = startIndex;
  if (last?.tracking_id) {
    const num = parseInt(String(last.tracking_id).split('-').pop(), 10);
    if (!Number.isNaN(num) && num >= next) next = num + 1;
  }
  return `MDY-${String(next).padStart(4, '0')}`;
};

const seedSampleData = async () => {
  await connectDB();

  const existingCount = await User.count({
    where: { email: { [Op.like]: `%${SAMPLE_EMAIL_DOMAIN}` } },
  });

  if (existingCount >= SAMPLE_USERS.length) {
    console.log(`ℹ️  Sample users already exist (${existingCount}). Skipping seed.`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(SAMPLE_PASSWORD, 12);
  const createdUsers = [];
  let trackingCounter = 100;

  for (let i = 0; i < SAMPLE_USERS.length; i += 1) {
    const profile = SAMPLE_USERS[i];
    const email = `sample.user${pad(i + 1)}${SAMPLE_EMAIL_DOMAIN}`;

    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        full_name: profile.full_name,
        email,
        phone: profile.phone,
        password: hashedPassword,
        role: 'user',
      },
    });

    if (created) {
      await sequelize.query('UPDATE users SET city = ? WHERE id = ?', {
        replacements: [profile.city, user.id],
      });
      createdUsers.push({ user, profile });
    }
  }

  if (!createdUsers.length) {
    console.log('ℹ️  No new sample users were created.');
    process.exit(0);
  }

  let bookingCount = 0;
  let cargoCount = 0;
  const today = new Date();

  for (let i = 0; i < createdUsers.length; i += 1) {
    const { user, profile } = createdUsers[i];
    const routeA = ROUTES[i % ROUTES.length];
    const routeB = ROUTES[(i + 2) % ROUTES.length];

    const bookings = [
      {
        user_id: user.id,
        trip_type: i % 4 === 0 ? 'roundtrip' : 'oneway',
        passenger_name: profile.full_name,
        phone: profile.phone,
        email: user.email,
        origin: routeA.origin,
        destination: routeA.destination,
        travel_date: addDays(today, 7 + i),
        return_date: i % 4 === 0 ? addDays(today, 14 + i) : null,
        adults: (i % 3) + 1,
        children: i % 5 === 0 ? 1 : 0,
        infants: 0,
        cabin_class: i % 6 === 0 ? 'business' : 'economy',
        seat_preference: i % 2 === 0 ? 'Window' : 'Aisle',
        special_requests: i % 3 === 0 ? 'Vegetarian meal requested' : null,
        status: BOOKING_STATUSES[i % BOOKING_STATUSES.length],
      },
      {
        user_id: user.id,
        trip_type: 'oneway',
        passenger_name: profile.full_name,
        phone: profile.phone,
        email: user.email,
        origin: routeB.origin,
        destination: routeB.destination,
        travel_date: addDays(today, 21 + i),
        adults: 1,
        children: 0,
        infants: 0,
        cabin_class: 'economy',
        status: BOOKING_STATUSES[(i + 1) % BOOKING_STATUSES.length],
      },
    ];

    for (const booking of bookings) {
      await Booking.create(booking);
      bookingCount += 1;
    }

    const cargos = [
      {
        tracking_id: await nextTrackingId(trackingCounter++),
        user_id: user.id,
        sender_name: profile.full_name,
        sender_phone: profile.phone,
        sender_email: user.email,
        sender_address: `${profile.city}, Somalia`,
        recipient_name: `Recipient ${pad(i + 1)}`,
        recipient_phone: `+252 61 900 ${5600 + i}`,
        origin: 'Galkacyo (GLK)',
        destination: routeA.destination,
        cargo_type: CARGO_TYPES[i % CARGO_TYPES.length],
        pieces: (i % 3) + 1,
        weight: Number((2.5 + (i % 8) * 1.25).toFixed(2)),
        length_cm: 40 + (i % 5) * 5,
        width_cm: 30 + (i % 4) * 3,
        description: `Sample shipment ${i + 1} – ${CARGO_TYPES[i % CARGO_TYPES.length]}`,
        shipping_speed: i % 3 === 0 ? 'express' : 'standard',
        insurance: i % 4 === 0,
        fragile: i % 5 === 0,
        signature_required: i % 2 === 0,
        status: CARGO_STATUSES[i % CARGO_STATUSES.length],
      },
      {
        tracking_id: await nextTrackingId(trackingCounter++),
        user_id: user.id,
        sender_name: profile.full_name,
        sender_phone: profile.phone,
        sender_email: user.email,
        recipient_name: `Office ${pad(i + 1)}`,
        recipient_phone: `+252 63 800 ${5600 + i}`,
        origin: 'Galkacyo (GLK)',
        destination: routeB.destination,
        cargo_type: CARGO_TYPES[(i + 1) % CARGO_TYPES.length],
        pieces: 1,
        weight: Number((1.5 + (i % 6)).toFixed(2)),
        description: `Second sample cargo for ${profile.full_name}`,
        shipping_speed: 'standard',
        status: CARGO_STATUSES[(i + 2) % CARGO_STATUSES.length],
      },
    ];

    for (const cargo of cargos) {
      await Cargo.create(cargo);
      cargoCount += 1;
    }
  }

  console.log('');
  console.log('✅ Sample data seeded successfully');
  console.log(`   Users created   : ${createdUsers.length}`);
  console.log(`   Bookings added  : ${bookingCount}`);
  console.log(`   Cargo added     : ${cargoCount}`);
  console.log('');
  console.log('🔐 Sample login (all users):');
  console.log(`   Password : ${SAMPLE_PASSWORD}`);
  console.log(`   Emails   : sample.user01${SAMPLE_EMAIL_DOMAIN} … sample.user20${SAMPLE_EMAIL_DOMAIN}`);
  console.log('');
  process.exit(0);
};

seedSampleData().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
