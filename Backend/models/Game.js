const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // dùng để truy cập /games/:slug
    description: { type: String, required: true },

    price: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },

    thumbnailUrl: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    trailerYoutubeId: { type: String, default: '' },

    genres: [{ type: String }], // ["Action", "RPG"]
    tags: [{ type: String }],   // ["Open World", "Souls-like"]

    minSpecs: {
      os: String,
      cpu: String,
      ram: String,
      gpu: String,
      storage: String,
    },

    releaseDate: Date,
    developer: String,
    publisher: String,

    // tạm thời để đây, sau này sẽ gắn với Orders
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // sau này khi có orders thì thêm soldCount vào
    soldCount: { type: Number, default: 0 },

    downloadInfo: {
      fileSize: Number,         // MB
      fileType: String,         // "zip", "exe"
      downloadUrl: String,      // link Google Drive / server
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Game', gameSchema);
