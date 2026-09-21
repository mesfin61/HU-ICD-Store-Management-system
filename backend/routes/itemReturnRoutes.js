const express = require("express");

const { protect, restrictTo } = require("../middleware/AuthMiddleware");

const {
  returnInventory,
  getReturnsByIssuedItem,
} = require("../controllers/itemReturnController");

const router = express.Router();

// =========================================================
// AUTHENTICATION
// =========================================================

router.use(protect);

// =========================================================
// GET RETURNS
// Authenticated users
// =========================================================

router.get(
  "/issued-item/:issuedItemId",
  restrictTo("Store Manager"),
  getReturnsByIssuedItem,
);

// =========================================================
// RETURN INVENTORY
// Store Manager ONLY
// =========================================================

router.post(
  "/issued-item/:issuedItemId",
  restrictTo("Store Manager"),
  returnInventory,
);

module.exports = router;
