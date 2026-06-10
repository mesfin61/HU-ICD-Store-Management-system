const express = require("express");
const {
  login,
  logout,
  getMe,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.post("/login", login);

// Private (token required)
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.patch("/change-password", protect, changePassword);

module.exports = router;
