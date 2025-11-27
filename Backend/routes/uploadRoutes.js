const express = require('express');
const multer = require('multer');
const { uploadImage } = require('../controllers/uploadController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Lưu file tạm vào /uploads
const upload = multer({ dest: 'uploads/' });

router.post(
  '/image',
  protect,
  adminOnly,
  upload.single('image'),
  uploadImage
);

module.exports = router;
