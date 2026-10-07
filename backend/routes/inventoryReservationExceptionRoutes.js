const express = require("express");

const {
  getOpenExceptions,
  getException,
  approveException,
  rejectException,
} = require("../controllers/inventoryReservationExceptionController");

const { protect, restrictTo, ROLES } = require("../middleware/AuthMiddleware");

const router = express.Router();

// =========================================================
// AUTHENTICATION
// =========================================================

router.use(protect);

// =========================================================
// ADMINISTRATOR ONLY
// =========================================================

router.get("/", restrictTo(ROLES.ADMINISTRATOR), getOpenExceptions);
router.get("/:id", restrictTo(ROLES.ADMINISTRATOR), getException);
router.post("/:id/approve", restrictTo(ROLES.ADMINISTRATOR), approveException);
router.post("/:id/reject", restrictTo(ROLES.ADMINISTRATOR), rejectException);

module.exports = router;
