const express = require("express");

const {
  getOpenExceptions,
  getException,
  approveException,
  rejectException,
} = require("../controllers/inventoryReservationExceptionController");

const { protect, restrictTo } = require("../middleware/AuthMiddleware");

const router = express.Router();

// =========================================================
// AUTHENTICATION
// =========================================================

router.use(protect);

// =========================================================
// ADMINISTRATOR ONLY
// =========================================================

router.get("/", restrictTo("Super Admin"), getOpenExceptions);

router.get("/:id", restrictTo("Super Admin"), getException);

router.post("/:id/approve", restrictTo("Super Admin"), approveException);

router.post("/:id/reject", restrictTo("Super Admin"), rejectException);

module.exports = router;
