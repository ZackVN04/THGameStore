const express = require('express');
const {
  getMyLibrary,
  checkOwnership,
  getDownloadLink,
} = require('../controllers/libraryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getMyLibrary);                       // GET /api/library
router.get('/check/:gameId', protect, checkOwnership);        // GET /api/library/check/:gameId
router.get('/download/:gameId', protect, getDownloadLink);    // GET /api/library/download/:gameId

module.exports = router;
