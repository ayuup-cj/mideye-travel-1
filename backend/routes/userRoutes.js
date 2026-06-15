const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  changePassword,
  getUserBookings,
  getUserCargo,
  getUserStats,
} = require('../controllers/userController');

const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadAvatar } = require('../middleware/uploadAvatar');

// All user routes require a valid token.
// Both 'user' and 'admin' roles can access these (admins may view their own data).
router.use(authenticateToken);

// GET  /api/user/profile
router.get('/profile', getProfile);

// PUT  /api/user/profile
router.put(
  '/profile',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  ],
  validate,
  updateProfile
);

// POST /api/user/profile/avatar
router.post(
  '/profile/avatar',
  (req, res, next) => {
    uploadAvatar.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid image upload.',
        });
      }
      next();
    });
  },
  uploadProfileAvatar
);

// PUT  /api/user/change-password
router.put('/change-password', changePassword);

// GET  /api/user/stats
router.get('/stats', getUserStats);

// GET  /api/user/bookings
router.get('/bookings', getUserBookings);

// GET  /api/user/cargo
router.get('/cargo', getUserCargo);

module.exports = router;
