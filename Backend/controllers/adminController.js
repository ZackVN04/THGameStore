const asyncHandler = require('express-async-handler');
const Game = require('../models/Game');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

// ===================== DASHBOARD =====================

// GET /api/admin/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const [userCount, gameCount, orderCount, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Game.countDocuments(),
    Order.countDocuments({ status: 'paid' }),
    Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]),
  ]);

  const totalRevenue =
    revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

  res.json({
    userCount,
    gameCount,
    orderCount,
    totalRevenue,
  });
});

// ===================== USERS =====================

// GET /api/admin/users
const adminGetUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-passwordHash')
    .sort({ createdAt: -1 });

  res.json(users);
});

// PATCH /api/admin/users/:id/role
// body: { role: 'user' | 'admin' }
const adminUpdateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // không cho tự đổi role của chính mình (cho vui)
  if (user._id.toString() === req.user._id.toString()) {
    return res
      .status(400)
      .json({ message: 'You cannot change your own role' });
  }

  user.role = role;
  await user.save();

  res.json({
    _id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
  });
});

// ===================== ORDERS =====================

// GET /api/admin/orders
const adminGetOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'email username');

  const orderIds = orders.map((o) => o._id);

  const items = await OrderItem.find({ orderId: { $in: orderIds } })
    .populate('gameId', 'title slug');

  const ordersWithItems = orders.map((order) => ({
    ...order.toObject(),
    items: items.filter(
      (it) => it.orderId.toString() === order._id.toString()
    ),
  }));

  res.json(ordersWithItems);
});

// PATCH /api/admin/orders/:id/status
// body: { status: 'pending' | 'paid' | 'failed' | 'cancelled' }
const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'paid', 'failed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  order.status = status;
  await order.save();

  res.json(order);
});

// ===================== GAMES =====================

// GET /api/admin/games  (có search + pagination để dùng cho admin page)
const adminGetGames = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
  } = req.query;

  const query = {};

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [games, total] = await Promise.all([
    Game.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Game.countDocuments(query),
  ]);

  res.json({
    data: games,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// POST /api/admin/games
const adminCreateGame = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    description,
    price,
    discountPercent,
    thumbnailUrl,
    bannerUrl,
    trailerYoutubeId,
    genres,
    tags,
    minSpecs,
    releaseDate,
    developer,
    publisher,
    downloadInfo,
  } = req.body;

  if (!title || !slug || !description || !price) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const existing = await Game.findOne({ slug });
  if (existing) {
    return res.status(400).json({ message: 'Slug already exists' });
  }

  const game = await Game.create({
    title,
    slug,
    description,
    price,
    discountPercent: discountPercent || 0,
    finalPrice: discountPercent
      ? Math.round(price * (1 - discountPercent / 100))
      : price,
    thumbnailUrl,
    bannerUrl,
    trailerYoutubeId,
    genres,
    tags,
    minSpecs,
    releaseDate,
    developer,
    publisher,
    downloadInfo,
  });

  res.status(201).json(game);
});

// PUT /api/admin/games/:id
const adminUpdateGame = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const game = await Game.findById(id);
  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }

  Object.assign(game, req.body);

  // update finalPrice nếu thay đổi giá/discount
  if (req.body.price || req.body.discountPercent) {
    const price = req.body.price ?? game.price;
    const discountPercent =
      req.body.discountPercent ?? game.discountPercent ?? 0;

    game.finalPrice = discountPercent
      ? Math.round(price * (1 - discountPercent / 100))
      : price;
  }

  await game.save();
  res.json(game);
});

// DELETE /api/admin/games/:id
const adminDeleteGame = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const game = await Game.findById(id);
  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }

  await game.deleteOne();
  res.json({ message: 'Game deleted' });
});

module.exports = {
  getDashboardStats,
  adminGetUsers,
  adminUpdateUserRole,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminGetGames,
  adminCreateGame,
  adminUpdateGame,
  adminDeleteGame,
};
