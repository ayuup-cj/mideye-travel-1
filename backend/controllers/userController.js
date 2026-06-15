const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { User, Booking, Cargo } = require('../models');
const { UPLOAD_DIR } = require('../middleware/uploadAvatar');

const PROFILE_ATTRS = ['id', 'full_name', 'email', 'phone', 'role', 'profile_image', 'created_at'];

const deleteAvatarFile = (profileImage) => {
  if (!profileImage || !profileImage.startsWith('/uploads/avatars/')) return;
  const filePath = path.join(__dirname, '..', profileImage.replace(/^\//, ''));
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (err) { console.error('deleteAvatarFile:', err.message); }
  }
};

// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: PROFILE_ATTRS,
    });
    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone } = req.body;

    await User.update(
      { full_name, phone: phone || null },
      { where: { id: req.user.id } }
    );

    const updated = await User.findByPk(req.user.id, {
      attributes: PROFILE_ATTRS.filter((a) => a !== 'created_at'),
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updated },
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/user/profile/avatar
const uploadProfileAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image to upload.',
      });
    }

    const user = await User.findByPk(req.user.id);
    if (user.profile_image) {
      deleteAvatarFile(user.profile_image);
    }

    const profileImage = `/uploads/avatars/${req.file.filename}`;
    await User.update({ profile_image: profileImage }, { where: { id: req.user.id } });

    const updated = await User.findByPk(req.user.id, {
      attributes: PROFILE_ATTRS.filter((a) => a !== 'created_at'),
    });

    return res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully.',
      data: { user: updated },
    });
  } catch (error) {
    if (req.file) {
      const uploaded = path.join(UPLOAD_DIR, req.file.filename);
      if (fs.existsSync(uploaded)) fs.unlinkSync(uploaded);
    }
    console.error('uploadProfileAvatar error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/user/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Both current and new password are required.',
      });
    }
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(new_password, salt);
    await User.update({ password: hashed }, { where: { id: req.user.id } });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/user/bookings
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings },
    });
  } catch (error) {
    console.error('getUserBookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/user/cargo
const getUserCargo = async (req, res) => {
  try {
    const shipments = await Cargo.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: { shipments },
    });
  } catch (error) {
    console.error('getUserCargo error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/user/stats
const getUserStats = async (req, res) => {
  try {
    const { Op } = require('sequelize');

    const [
      totalBookings,
      totalCargo,
      pendingBookings,
      confirmedBookings,
      inTransitCargo,
      arrivedCargo,
    ] = await Promise.all([
      Booking.count({ where: { user_id: req.user.id } }),
      Cargo.count({ where: { user_id: req.user.id } }),
      Booking.count({
        where: {
          user_id: req.user.id,
          status: { [Op.in]: ['Pending', 'Confirmed'] },
        },
      }),
      Booking.count({ where: { user_id: req.user.id, status: 'Confirmed' } }),
      Cargo.count({ where: { user_id: req.user.id, status: 'In Transit' } }),
      Cargo.count({ where: { user_id: req.user.id, status: 'Arrived' } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total_bookings: totalBookings,
          total_cargo: totalCargo,
          pending_bookings: pendingBookings, // Pending + Confirmed (awaiting travel)
          confirmed_bookings: confirmedBookings,
          cargo_in_transit: inTransitCargo,
          cargo_arrived: arrivedCargo,
        },
      },
    });
  } catch (error) {
    console.error('getUserStats error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  changePassword,
  getUserBookings,
  getUserCargo,
  getUserStats,
};
