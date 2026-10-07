const express = require("express");

const {
  protect,
  restrictTo,
  ROLES,
} = require("../middleware/AuthMiddleware");

const {
  createItem,
  getAllItems,
  getItemById,
  receiveStock,
  adjustStockIn,
  adjustStockOut,
  writeOffStock,
} = require("../controllers/inventoryController");

const {
  getInventoryMovementTrends,
} = require("../controllers/inventoryTransactionController");

const router = express.Router();

// =========================================================
// AUTHENTICATION
// =========================================================

router.use(protect);

// =========================================================
// INVENTORY READ
// Authenticated users
// =========================================================

router.get(
  "/",
  restrictTo(ROLES.DIRECTORATE, ROLES.STORE_MANAGER, ROLES.STAFF),
  getAllItems,
);

// =========================================================
// INVENTORY MOVEMENT READ
// Authenticated users
//
// IMPORTANT:
// This route MUST appear before "/:id".
// Otherwise "transactions" could be interpreted as an item ID.
// =========================================================

router.get(
  "/transactions/trends",
  restrictTo(ROLES.DIRECTORATE, ROLES.STORE_MANAGER, ROLES.STAFF),
  getInventoryMovementTrends,
);

// =========================================================
// CREATE INVENTORY ITEM
// Store Manager only
// =========================================================

router.post("/", restrictTo("Store Manager"), createItem);

// =========================================================
// GET INVENTORY ITEM BY ID
// =========================================================

router.get(
  "/:id",
  restrictTo(ROLES.DIRECTORATE, ROLES.STORE_MANAGER, ROLES.STAFF),
  getItemById,
);

// =========================================================
// STOCK MANAGEMENT
// Store Manager only
// =========================================================

router.post("/:id/receive", restrictTo("Store Manager"), receiveStock);

router.post("/:id/adjust-in", restrictTo("Store Manager"), adjustStockIn);

router.post("/:id/adjust-out", restrictTo("Store Manager"), adjustStockOut);

router.post("/:id/write-off", restrictTo("Store Manager"), writeOffStock);

module.exports = router;
