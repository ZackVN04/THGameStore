const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Email already used' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    email,
    username,
    passwordHash,
  });

  return res.status(201).json({
    _id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    token: generateToken(user._id),
  });
});

// POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  return res.json({
    _id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    token: generateToken(user._id),
  });
});

// GET /api/auth/me  (lấy profile user đang đăng nhập)
const getMe = asyncHandler(async (req, res) => {
  return res.json(req.user); // đã được set trong protect middleware
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
