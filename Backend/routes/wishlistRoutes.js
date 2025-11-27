const express = require('express');
const {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getMyWishlist);                 // GET /api/wishlist
router.post('/:gameId', protect, addToWishlist);         // POST /api/wishlist/:gameId
router.delete('/:gameId', protect, removeFromWishlist);  // DELETE /api/wishlist/:gameId

module.exports = router;
