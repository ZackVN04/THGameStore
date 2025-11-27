const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema(
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
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: 'purchase', // 'purchase' | 'gift' | 'admin_grant'
    },
  },
  { timestamps: true }
);

// 1 user chỉ có 1 record cho mỗi game
librarySchema.index({ userId: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('Library', librarySchema);
