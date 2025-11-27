const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true, // giá tại thời điểm mua
    },
    quantity: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // chỉ cần createdAt
);

module.exports = mongoose.model('OrderItem', orderItemSchema);
