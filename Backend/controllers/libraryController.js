const asyncHandler = require('express-async-handler');
const Library = require('../models/Library');
const Game = require('../models/Game');

// GET /api/library
// trả về list game user sở hữu
const getMyLibrary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const libraryItems = await Library.find({ userId })
    .sort({ acquiredAt: -1 })
    .populate('gameId', 'title slug thumbnailUrl bannerUrl downloadInfo');

  const games = libraryItems.map((item) => ({
    libraryId: item._id,
    acquiredAt: item.acquiredAt,
    game: item.gameId,
  }));

  res.json(games);
});

// GET /api/library/check/:gameId
const checkOwnership = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { gameId } = req.params;

  const record = await Library.findOne({ userId, gameId });

  res.json({
    hasGame: !!record,
  });
});

// GET /api/library/download/:gameId
const getDownloadLink = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { gameId } = req.params;

  const record = await Library.findOne({ userId, gameId });
  if (!record) {
    return res.status(403).json({ message: 'You do not own this game' });
  }

  const game = await Game.findById(gameId);

  if (!game || !game.downloadInfo || !game.downloadInfo.downloadUrl) {
    return res.status(404).json({ message: 'Download info not found' });
  }

  res.json({
    downloadUrl: game.downloadInfo.downloadUrl,
    fileSize: game.downloadInfo.fileSize,
    fileType: game.downloadInfo.fileType,
  });
});

module.exports = {
  getMyLibrary,
  checkOwnership,
  getDownloadLink,
};
