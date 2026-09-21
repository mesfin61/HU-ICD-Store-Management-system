const express = require("express");

const inventoryReservationController = require("../controllers/inventoryReservationController");

const { protect, restrictTo, ROLES } = require("../middleware/AuthMiddleware");

const router = express.Router();

// =========================================================
// GET RESERVATIONS FOR REQUEST
//
// Reservation creation is INTERNAL ONLY.
//
// Administrator:
//   Can inspect.
//
// Store Manager:
//   Can inspect approved requests for issuance.
//
// Staff:
//   Can inspect their own request.
//
// =========================================================

router.get(
  "/request/:requestId",
  protect,
  restrictTo(ROLES.ADMINISTRATOR, ROLES.STORE_MANAGER, ROLES.STAFF),
  inventoryReservationController.getByRequest,
);

module.exports = router;
