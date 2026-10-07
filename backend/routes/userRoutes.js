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

router.get("/", getAllUsers);

router.get("/:id", getUserById);

router.post("/", createUser);

router.put("/:id", updateUser);

router.patch(
  "/:id/transfer-ownership",
  restrictToExact(ROLES.ADMINISTRATOR),
  transferOwnership,
);

router.patch("/:id/change-password", changePassword);

router.patch("/:id/activate", restrictToExact(ROLES.ADMINISTRATOR), activateUser);
router.patch("/:id/deactivate", restrictToExact(ROLES.ADMINISTRATOR), deactivateUser);

/*
 * Kept for API compatibility, but controller
 * intentionally rejects hard deletion.
 */
router.delete("/:id", deleteUser);

module.exports = router;
