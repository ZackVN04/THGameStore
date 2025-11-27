const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/Wishlist');

// GET /api/wishlist
// trả về danh sách game trong wishlist của user
const getMyWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const items = await Wishlist.find({ userId })
    .sort({ createdAt: -1 })
    .populate('gameId', 'title slug thumbnailUrl finalPrice price');

  const games = items.map((item) => ({
    wishlistId: item._id,
    addedAt: item.createdAt,
    game: item.gameId,
  }));

  res.json(games);
});

// POST /api/wishlist/:gameId
// thêm game vào wishlist
const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { gameId } = req.params;

  await Wishlist.updateOne(
    { userId, gameId },
    { $setOnInsert: { userId, gameId } },
    { upsert: true }
  );

  res.status(201).json({ message: 'Added to wishlist' });
});

// DELETE /api/wishlist/:gameId
// xoá game khỏi wishlist
const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { gameId } = req.params;

  await Wishlist.deleteOne({ userId, gameId });

  res.json({ message: 'Removed from wishlist' });
});

module.exports = {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
};
