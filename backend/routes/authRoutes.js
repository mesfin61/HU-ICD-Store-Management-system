const express = require("express");
const {
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  updateProfile,
  updateProfilePicture,
} = require("../controllers/authController");
const { protect } = require("../middleware/AuthMiddleware");
const { uploadProfilePicture } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
// Private (token required)
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.patch("/change-password", protect, changePassword);
router.patch("/profile", protect, updateProfile);
router.patch(
  "/profile-picture",
  protect,
  uploadProfilePicture.single("profilePicture"),
  updateProfilePicture,
);
module.exports = router;
