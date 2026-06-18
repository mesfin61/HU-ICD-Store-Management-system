require("dotenv").config();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { user } = require("../models");
const { findByEmail, findById } = require("../models/user");

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

    const isMatch = await bcrypt.compare(password, foundUser.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
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
        phoneNumber: foundUser.phone_number,
        officeLocation: foundUser.office_location,
        profilePicture: foundUser.profile_picture,
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const foundUser = await user.findByEmail(email.trim().toLowerCase());

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message:
          "This email is not registered. Contact the administrator if you believe this is an error.",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await user.saveResetOtp(foundUser.id, otp, expiresAt);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: foundUser.email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Password Reset Request</h2>

          <p>Hello ${foundUser.full_name},</p>

          <p>Your password reset verification code is:</p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #1141a0;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>This code expires in 10 minutes.</p>

          <p>If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (err) {
    console.error("[Auth] forgotPassword error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const foundUser = await user.findByEmailWithOtp(email.trim().toLowerCase());

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!foundUser.reset_otp) {
      return res.status(400).json({
        success: false,
        message: "No OTP requested.",
      });
    }

    if (
      foundUser.reset_otp_expires &&
      foundUser.reset_otp_expires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
      });
    }

    if (foundUser.reset_otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (err) {
    console.error("[Auth] verifyResetOtp error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const foundUser = await user.findByEmailWithOtp(email.trim().toLowerCase());

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (
      !foundUser.reset_otp_expires ||
      new Date() > new Date(foundUser.reset_otp_expires)
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await user.updatePassword(foundUser.id, passwordHash);

    await user.clearResetOtp(foundUser.id);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (err) {
    console.error("[Auth] resetPassword error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const updateProfile = async (req, res) => {
  const { fullName, email, phoneNumber, officeLocation } = req.body;

  if (!fullName || !email || !phoneNumber || !officeLocation) {
    return res.status(400).json({
      success: false,
      message: "all fields are required.",
    });
  }

  try {
    const { id } = req.user;
    const foundUser = await findById(id);

    if (!foundUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (email && email.trim().toLowerCase() !== foundUser.email) {
      const emailTaken = await user.findByEmail(email.trim().toLowerCase());
      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another user.",
        });
      }
    }

    const updated = await user.updateProfile(id, {
      fullName: fullName ?? foundUser.full_name,
      email: email ? email.trim().toLowerCase() : foundUser.email,
      phoneNumber: phoneNumber ?? foundUser.phone_number,
      officeLocation: officeLocation ?? foundUser.office_location,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("[Auth] updateProfile error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const updatedUser = await user.updateProfilePicture(
      req.user.id,
      `/uploads/profiles/${req.file.filename}`,
    );

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    console.error("[Auth] updateProfilePicture error:", err);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

module.exports = {
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  updateProfile,
  updateProfilePicture,
};
