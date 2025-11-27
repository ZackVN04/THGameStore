const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// 1 user chỉ được 1 review / game
reviewSchema.index({ userId: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
