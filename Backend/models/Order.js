const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'paid', // vì đang fake payment => coi như luôn thanh toán thành công
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'fake', // sau này có thể 'vnpay', 'momo', ...
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

module.exports = mongoose.model('Order', orderSchema);
