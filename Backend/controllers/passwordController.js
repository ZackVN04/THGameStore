const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const transporter = require("../config/nodemailer");

// POST /api/password/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpire = Date.now() + 15 * 60 * 1000;

    user.resetToken = resetToken;
    user.resetTokenExpire = tokenExpire;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;

    await transporter.sendMail({
      from: `"THGameStore" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Đặt lại mật khẩu của bạn",
      html: `
        <p>Xin chào ${user.username || 'bạn'},</p>
        <p>Nhấn vào link sau để đặt lại mật khẩu (hết hạn sau 15 phút):</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
      `,
    });

    res.json({ message: "Email đặt lại mật khẩu đã được gửi!" });

  } catch (error) {
    console.error("Lỗi gửi email:", error);
    res.status(500).json({ message: "Không thể gửi email reset mật khẩu" });
  }
};


// POST /api/password/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, email } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
      email,
    });

    if (!user)
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;

    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.json({ message: "Mật khẩu đã được đặt lại thành công!" });

  } catch (error) {
    console.error("Lỗi reset mật khẩu:", error);
    res.status(500).json({ message: "Không thể đặt lại mật khẩu" });
  }
};
