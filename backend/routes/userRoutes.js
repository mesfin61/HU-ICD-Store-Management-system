const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/AuthMiddleware");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
} = require("../controllers/userControllers");

router.use(protect);
router.use(restrictTo("Super Admin", "admin"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/deactivate", deactivateUser);
router.delete("/:id", deleteUser);

module.exports = router;
