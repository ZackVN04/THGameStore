const asyncHandler = require('express-async-handler');
const Game = require('../models/Game');

// GET /api/games
// query: ?page=1&limit=12&search=...&genre=Action&tag=Indie&sort=top-sell
const getGames = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search,
    genre,
    tag,
    sort, // newest | top-sell | rating | price-asc | price-desc
  } = req.query;

  const query = {};

  if (search) {
    query.title = { $regex: search, $options: 'i' }; // search theo title
  }

  if (genre) {
    query.genres = { $in: [genre] };
  }

  if (tag) {
    query.tags = { $in: [tag] };
  }

  let sortOption = { createdAt: -1 }; // mặc định: mới nhất

  switch (sort) {
    case 'top-sell':
      sortOption = { soldCount: -1 };
      break;
    case 'rating':
      sortOption = { ratingAverage: -1 };
      break;
    case 'price-asc':
      sortOption = { finalPrice: 1 };
      break;
    case 'price-desc':
      sortOption = { finalPrice: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [games, total] = await Promise.all([
    Game.find(query).sort(sortOption).skip(skip).limit(limitNum),
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

// GET /api/games/:slug  (public) – game detail
const getGameBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const game = await Game.findOne({ slug });

  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }

  res.json(game);
});

// GET /api/games/top-sell/list?limit=10
const getTopSellGames = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const games = await Game.find({})
    .sort({ soldCount: -1 })
    .limit(limit);

  res.json(games);
});

// GET /api/games/latest/list?limit=10
const getLatestGames = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const games = await Game.find({})
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json(games);
});

// GET /api/games/filters/options
const getGameFilters = asyncHandler(async (req, res) => {
  const genresAgg = await Game.aggregate([
    { $unwind: '$genres' },
    { $group: { _id: '$genres' } },
    { $sort: { _id: 1 } },
  ]);

  const tagsAgg = await Game.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags' } },
    { $sort: { _id: 1 } },
  ]);

  const genres = genresAgg.map((g) => g._id);
  const tags = tagsAgg.map((t) => t._id);

  res.json({ genres, tags });
});

// POST /api/games  (admin) – create game
const createGame = asyncHandler(async (req, res) => {
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

// PUT /api/games/:id  (admin) – update game
const updateGame = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const game = await Game.findById(id);
  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }

  // cập nhật từ body
  Object.assign(game, req.body);

  // nếu có thay đổi price/discount thì cập nhật finalPrice
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

// DELETE /api/games/:id  (admin) – delete game
const deleteGame = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const game = await Game.findById(id);
  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }

  await game.deleteOne();
  res.json({ message: 'Game deleted' });
});

module.exports = {
  getGames,
  getGameBySlug,
  getTopSellGames,
  getLatestGames,
  getGameFilters,
  createGame,
  updateGame,
  deleteGame,
};
