const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { user } = require("../models");

function signToken(foundUser) {
  return jwt.sign(
    { id: foundUser.id, role: foundUser.role_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
  );
}

function sendTokenResponse(res, foundUser, statusCode = 200) {
  const token = signToken(foundUser);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: foundUser.id,
        fullName: foundUser.full_name,
        email: foundUser.email,
        role: foundUser.role_name, // ← role_name from JOIN
        isActive: foundUser.is_active,
      },
    });
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const foundUser = await user.findByEmail(email.trim().toLowerCase());

    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!foundUser.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact the administrator.",
      });
    }

    if (!foundUser.password_hash) {
      return res.status(401).json({
        success: false,
        message: "Account has no password set. Contact the administrator.",
      });
    }

    sendTokenResponse(res, foundUser, 200);
  } catch (err) {
    console.error("[Auth] login error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const logout = (req, res) => {
  res
    .status(200)
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .json({ success: true, message: "Logged out successfully." });
};

const getMe = async (req, res) => {
  try {
    const foundUser = await user.findById(req.user.id); // ← user model, foundUser result

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: foundUser.id,
        fullName: foundUser.full_name,
        email: foundUser.email,
        role: foundUser.role_name,
        isActive: foundUser.is_active,
        createdAt: foundUser.created_at,
      },
    });
  } catch (err) {
    console.error("[Auth] getMe error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    const foundUser = await user.findByEmail(req.user.email);

    if (!foundUser || !foundUser.password_hash) {
      return res.status(400).json({
        success: false,
        message: "No password set for this account.",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      foundUser.password_hash,
    );
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);
    await user.updatePassword(foundUser.id, newHash); // ← user model, foundUser.id

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("[Auth] changePassword error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { login, logout, getMe, changePassword };
