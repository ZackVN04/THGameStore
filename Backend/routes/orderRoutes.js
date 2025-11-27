const express = require('express');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// tất cả order đều cần đăng nhập
router.post('/checkout', protect, createOrder); // POST /api/orders/checkout
router.get('/my', protect, getMyOrders);        // GET /api/orders/my

module.exports = router;
