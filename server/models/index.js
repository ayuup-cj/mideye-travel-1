const User = require('./User');
const Booking = require('./Booking');
const Cargo = require('./Cargo');

// Associations
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Cargo, { foreignKey: 'user_id', as: 'cargo_shipments' });
Cargo.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { User, Booking, Cargo };
