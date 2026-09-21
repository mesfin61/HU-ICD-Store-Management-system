const express = require("express");
const router = express.Router();

const {
  protect,
  restrictTo,
  restrictToExact,
  ROLES,
} = require("../middleware/AuthMiddleware");

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  transferOwnership,
  changePassword,
  activateUser,
  deactivateUser,
  deleteUser,
} = require("../controllers/userControllers");

router.use(protect);

router.use(restrictTo(ROLES.ADMINISTRATOR));

router.get("/", restrictTo("Super Admin"), getAllUsers);

router.get("/:id", restrictTo("Super Admin"), getUserById);

router.post("/", restrictTo("Super Admin"), createUser);

router.put("/:id", restrictTo("Super Admin"), updateUser);

router.patch(
  "/:id/transfer-ownership",
  restrictToExact(ROLES.SUPER_ADMIN),
  transferOwnership,
);

router.patch("/:id/change-password", changePassword);

router.patch("/:id/activate", restrictToExact(ROLES.SUPER_ADMIN), activateUser);
router.patch("/:id/deactivate", restrictToExact(ROLES.SUPER_ADMIN), deactivateUser);

/*
 * Kept for API compatibility, but controller
 * intentionally rejects hard deletion.
 */
router.delete("/:id", deleteUser);

module.exports = router;
