const express = require("express");
const router = express.Router();

const {
  protect,
  restrictTo,
  ROLES,
} = require("../middleware/AuthMiddleware");

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
} = require("../controllers/userControllers");

router.use(protect);

router.use(restrictTo(ROLES.ADMINISTRATOR));

router.get("/",
  restrictTo("Administrator"),
  getAllUsers);

router.get("/:id",
  restrictTo("Administrator"),
  getUserById);

router.post("/",
  restrictTo("Administrator"),
  createUser);

router.put("/:id",
  restrictTo("Administrator"),
  updateUser);

router.patch("/:id/deactivate",
  restrictTo("Administrator"),
  deactivateUser);

/*
 * Kept for API compatibility, but controller
 * intentionally rejects hard deletion.
 */
router.delete("/:id", deleteUser);

module.exports = router;