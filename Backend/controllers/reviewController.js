const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Game = require('../models/Game');
const Library = require('../models/Library');

// hàm phụ: cập nhật ratingAverage & ratingCount cho game
const updateGameRating = async (gameId) => {
  const stats = await Review.aggregate([
    { $match: { gameId } },
    {
      $group: {
        _id: '$gameId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length === 0) {
    await Game.updateOne(
      { _id: gameId },
      { $set: { ratingAverage: 0, ratingCount: 0 } }
    );
  } else {
    await Game.updateOne(
      { _id: gameId },
      {
        $set: {
          ratingAverage: stats[0].avgRating,
          ratingCount: stats[0].count,
        },
      }
    );
  }
};

// GET /api/reviews/game/:gameId?page=&limit=
// lấy danh sách review cho 1 game
const getReviewsForGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ gameId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username avatarUrl'),
    Review.countDocuments({ gameId }),
  ]);

  res.json({
    data: reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/reviews/game/:gameId
// body: { rating, comment }
// nếu user đã review game -> update, chưa có -> create
const upsertReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { gameId } = req.params;
  const { rating, comment } = req.body;

  if (!rating) {
    return res.status(400).json({ message: 'Rating is required' });
  }

  // check user có sở hữu game không
  const hasGame = await Library.findOne({ userId, gameId });
  if (!hasGame) {
    return res
      .status(403)
      .json({ message: 'You must own this game to review it' });
  }

  let review = await Review.findOne({ userId, gameId });

  if (review) {
    // update
    review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();
  } else {
    // create
    review = await Review.create({
      userId,
      gameId,
      rating,
      comment,
    });
  }

  // update ratingAverage & ratingCount cho game
  await updateGameRating(review.gameId);

  res.status(201).json(review);
});

// DELETE /api/reviews/:id
// user chỉ được xóa review của mình, admin xóa được tất cả
const deleteReview = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  // nếu không phải admin thì chỉ xoá được review của chính mình
  if (user.role !== 'admin' && review.userId.toString() !== user._id.toString()) {
    return res.status(403).json({ message: 'Not allowed to delete this review' });
  }

  const gameId = review.gameId;
  await review.deleteOne();

  await updateGameRating(gameId);

  res.json({ message: 'Review deleted' });
});

// GET /api/reviews/my
// lấy review của user hiện tại
const getMyReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const reviews = await Review.find({ userId })
    .sort({ createdAt: -1 })
    .populate('gameId', 'title slug thumbnailUrl');

  res.json(reviews);
});

module.exports = {
  getReviewsForGame,
  upsertReview,
  deleteReview,
  getMyReviews,
};
