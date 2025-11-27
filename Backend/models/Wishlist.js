const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
  },
  { timestamps: true }
);

// 1 game chỉ xuất hiện 1 lần trong wishlist mỗi user
wishlistSchema.index({ userId: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
