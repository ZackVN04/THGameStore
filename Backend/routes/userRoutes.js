// routes/userRoutes.js
const express = require('express');
const {
  getMyProfile,
  updateMyProfile,
  changePassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
