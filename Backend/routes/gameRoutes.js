const express = require('express');
const {
  getGames,
  getGameBySlug,
  getTopSellGames,
  getLatestGames,
  getGameFilters,
  createGame,
  updateGame,
  deleteGame,
} = require('../controllers/gameController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Public
router.get('/', getGames);
router.get('/top-sell/list', getTopSellGames);
router.get('/latest/list', getLatestGames);
router.get('/filters/options', getGameFilters);
router.get('/:slug', getGameBySlug);

// Admin
router.post('/', protect, adminOnly, createGame);
router.put('/:id', protect, adminOnly, updateGame);
router.delete('/:id', protect, adminOnly, deleteGame);

module.exports = router;
