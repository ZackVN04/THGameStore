const express = require('express');
const {
  getReviewsForGame,
  upsertReview,
  deleteReview,
  getMyReviews,
} = require('../controllers/reviewController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// public: xem review của game
router.get('/game/:gameId', getReviewsForGame);

// user phải đăng nhập
router.post('/game/:gameId', protect, upsertReview); // tạo / update review
router.get('/my', protect, getMyReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;
