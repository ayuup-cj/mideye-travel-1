const { User, Booking, Cargo } = require('../models');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: { users },
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'phone'],
          required: false,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings },
    });
  } catch (error) {
    console.error('Admin get bookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/cargo
const getAllCargo = async (req, res) => {
  try {
    const shipments = await Cargo.findAll({
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email'],
          required: false,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: { shipments },
    });
  } catch (error) {
    console.error('Admin get cargo error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalBookings, totalCargo, pendingBookings, inTransitCargo] =
      await Promise.all([
        User.count({ where: { role: 'user' } }),
        Booking.count(),
        Cargo.count(),
        Booking.count({ where: { status: 'Pending' } }),
        Cargo.count({ where: { status: 'In Transit' } }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total_users: totalUsers,
          total_bookings: totalBookings,
          total_cargo: totalCargo,
          pending_bookings: pendingBookings,
          cargo_in_transit: inTransitCargo,
        },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { full_name, email, phone, city, role, status } = req.body;
    const updates = {};

    if (full_name !== undefined) {
      const name = String(full_name).trim();
      if (name.length < 2) {
        return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters.' });
      }
      updates.full_name = name;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email address.' });
      }
      const existing = await User.findOne({ where: { email: normalizedEmail } });
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ success: false, message: 'Email is already in use.' });
      }
      updates.email = normalizedEmail;
    }

    if (phone !== undefined) updates.phone = String(phone).trim() || null;
    if (city !== undefined) updates.city = String(city).trim() || null;

    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Role must be user or admin.' });
      }
      if (user.role === 'admin' && role !== 'admin' && user.id === req.user.id) {
        return res.status(403).json({ success: false, message: 'You cannot change your own admin role.' });
      }
      updates.role = role;
    }

    if (status !== undefined) {
      if (!['Active', 'Inactive'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be Active or Inactive.' });
      }
      if (user.role === 'admin' && status === 'Inactive') {
        return res.status(403).json({ success: false, message: 'Admin accounts cannot be deactivated.' });
      }
      updates.status = status;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    await user.update(updates);

    const safeUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: { user: safeUser },
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin accounts.' });
    }
    await user.destroy();
    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllUsers, getAllBookings, getAllCargo, getDashboardStats, updateUser, deleteUser };
