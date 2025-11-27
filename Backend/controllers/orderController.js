const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Library = require('../models/Library');
const Game = require('../models/Game');

// POST /api/orders/checkout
// body: { items: [{ gameId, quantity }], paymentMethod }
const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { items, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order items are required' });
  }

  // Lấy thông tin game
  const gameIds = items.map((i) => i.gameId);
  const games = await Game.find({ _id: { $in: gameIds } });

  if (games.length !== items.length) {
    return res.status(400).json({ message: 'Some games not found' });
  }

  // Tính tổng & chuẩn hoá items
  let totalAmount = 0;
  const orderItemsData = [];

  for (const item of items) {
    const game = games.find((g) => g._id.toString() === item.gameId);
    if (!game) continue;

    const unitPrice = game.finalPrice || game.price;
    const quantity = item.quantity || 1;

    totalAmount += unitPrice * quantity;

    orderItemsData.push({
      gameId: game._id,
      unitPrice,
      quantity,
    });
  }

  // Fake payment: luôn thành công => status = 'paid'
  const order = await Order.create({
    userId,
    status: 'paid',
    totalAmount,
    paymentMethod: paymentMethod || 'fake',
  });

  // Tạo order_items
  const orderItemsToCreate = orderItemsData.map((item) => ({
    orderId: order._id,
    gameId: item.gameId,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  }));

  await OrderItem.insertMany(orderItemsToCreate);

  // Cập nhật soldCount & Library
  for (const item of orderItemsData) {
    // tăng soldCount
    await Game.updateOne(
      { _id: item.gameId },
      { $inc: { soldCount: item.quantity } }
    );

    // thêm vào Library nếu chưa có
    await Library.updateOne(
      { userId, gameId: item.gameId },
      {
        $setOnInsert: {
          userId,
          gameId: item.gameId,
          acquiredAt: new Date(),
          source: 'purchase',
        },
      },
      { upsert: true }
    );
  }

  res.status(201).json({
    message: 'Order created & games added to library',
    orderId: order._id,
  });
});

// GET /api/orders/my
const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Lấy list orders
  const orders = await Order.find({ userId }).sort({ createdAt: -1 });

  // Lấy toàn bộ orderId
  const orderIds = orders.map((o) => o._id);

  // Lấy order_items + populate game
  const orderItems = await OrderItem.find({ orderId: { $in: orderIds } })
    .populate('gameId', 'title thumbnailUrl slug price finalPrice');

  // Gộp items vào từng order
  const ordersWithItems = orders.map((order) => {
    const items = orderItems.filter(
      (item) => item.orderId.toString() === order._id.toString()
    );

    return {
      ...order.toObject(),
      items,
    };
  });

  res.json(ordersWithItems);
});

module.exports = {
  createOrder,
  getMyOrders,
};
