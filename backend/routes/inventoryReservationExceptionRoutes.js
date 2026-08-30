const express = require("express");

const {
  getOpenExceptions,
  getException,
  approveException,
  rejectException,
} = require("../controllers/inventoryReservationExceptionController");

const {
  protect,
  restrictTo,
} = require("../middleware/AuthMiddleware");

const router = express.Router();

// =========================================================
// AUTHENTICATION
// =========================================================

router.use(protect);

// =========================================================
// ADMINISTRATOR ONLY
// =========================================================

router.get(
  "/",
  restrictTo("Administrator"),
  getOpenExceptions,
);

router.get(
  "/:id",
  restrictTo("Administrator"),
  getException,
);

router.post(
  "/:id/approve",
  restrictTo("Administrator"),
  approveException,
);

router.post(
  "/:id/reject",
  restrictTo("Administrator"),
  rejectException,
);

module.exports = router;