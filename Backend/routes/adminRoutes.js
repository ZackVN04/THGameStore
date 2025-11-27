const express = require('express');
const {
  getDashboardStats,
  adminGetUsers,
  adminUpdateUserRole,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminGetGames,
  adminCreateGame,
  adminUpdateGame,
  adminDeleteGame,
} = require('../controllers/adminController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// tất cả route admin đều yêu cầu login + role admin
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', adminGetUsers);                     // GET /api/admin/users
router.patch('/users/:id/role', adminUpdateUserRole);    // PATCH /api/admin/users/:id/role

// Orders
router.get('/orders', adminGetOrders);                   // GET /api/admin/orders
router.patch('/orders/:id/status', adminUpdateOrderStatus); // PATCH /api/admin/orders/:id/status

// Games
router.get('/games', adminGetGames);                     // GET /api/admin/games
router.post('/games', adminCreateGame);                  // POST /api/admin/games
router.put('/games/:id', adminUpdateGame);               // PUT /api/admin/games/:id
router.delete('/games/:id', adminDeleteGame);            // DELETE /api/admin/games/:id

module.exports = router;
