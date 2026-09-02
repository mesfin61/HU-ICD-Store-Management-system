const express = require("express");

const {
  protect,
  restrictTo,
} = require("../middleware/AuthMiddleware");

const {
  issueInventory,
  getIssuancesByRequest,
  getOutstandingIssuedItems,
  getMyOutstandingIssuedItems,
} = require("../controllers/issuanceController");

const router = express.Router();

// =========================================================
// AUTHENTICATION
// =========================================================

router.use(protect);



// =========================================================
// OUTSTANDING ISSUED INVENTORY
// =========================================================

router.get(
  "/outstanding",
  restrictTo("Store Manager"),
  getOutstandingIssuedItems,
);


// =========================================================
// GET ISSUANCES FOR REQUEST
//
// Any authenticated user can query the endpoint, but the
// controller should eventually enforce ownership/role rules
// if this becomes sensitive.
// =========================================================

router.get(
  "/request/:requestId",
  restrictTo("Store Manager"),
  getIssuancesByRequest,
);

// =========================================================
// ISSUE INVENTORY
//
// Store Manager ONLY.
//
// IMPORTANT:
// This does NOT subtract current_stock.
// Reservation already did that.
// =========================================================

// =========================================================
// STAFF: MY OUTSTANDING ISSUED INVENTORY
// =========================================================

router.get(
  "/my-outstanding",
  restrictTo("Staff"),
  getMyOutstandingIssuedItems,
);

router.post(
  "/request/:requestId",
  restrictTo("Store Manager"),
  issueInventory,
);

module.exports = router;