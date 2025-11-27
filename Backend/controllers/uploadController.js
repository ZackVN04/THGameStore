const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');

// POST /api/upload/image
// form-data: key = image (type: File)
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const inputPath = req.file.path; // file gốc Multer lưu
  const ext = path.extname(req.file.originalname) || '.jpg';
  const resizedFilename = `resized-${Date.now()}-${req.file.filename}.jpg`;
  const outputPath = path.join('uploads', resizedFilename);

  try {
    // 🔧 Dùng Sharp để resize + nén
    // Ví dụ: tối đa 800x450, giữ tỉ lệ, JPEG quality 80
    await sharp(inputPath)
      .resize(800, 450, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    // 📤 Upload file đã resize lên Cloudinary
    const result = await cloudinary.uploader.upload(outputPath, {
      folder: 'games', // bạn muốn đổi tên folder thì sửa ở đây
    });

    // 🧹 Xoá cả file gốc và file resize trên server
    fs.unlink(inputPath, () => {});
    fs.unlink(outputPath, () => {});

    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error('Upload error:', err);

    // cố gắng xoá file nếu có lỗi
    fs.unlink(inputPath, () => {});
    fs.unlink(outputPath, () => {});

    return res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = {
  uploadImage,
};
