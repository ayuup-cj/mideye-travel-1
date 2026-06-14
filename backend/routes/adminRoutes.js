const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getAllBookings,
  getAllCargo,
  getDashboardStats,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/bookings', getAllBookings);
router.get('/cargo', getAllCargo);

module.exports = router;
