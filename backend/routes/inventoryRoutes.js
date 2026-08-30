const express = require("express");

const {
  protect,
  restrictTo,
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

const router = express.Router();

// =========================================================
// AUTHENTICATION
// =========================================================

router.use(protect);



// =========================================================
// INVENTORY READ
// Authenticated users
// =========================================================

router.get("/", getAllItems);

router.post(
  "/",
  restrictTo("Store Manager"),
  createItem,
);

router.get("/:id", getItemById);

// =========================================================
// STOCK MANAGEMENT
// Store Manager only
// =========================================================

router.post(
  "/:id/receive",
  restrictTo("Store Manager"),
  receiveStock,
);

router.post(
  "/:id/adjust-in",
  restrictTo("Store Manager"),
  adjustStockIn,
);

router.post(
  "/:id/adjust-out",
  restrictTo("Store Manager"),
  adjustStockOut,
);

router.post(
  "/:id/write-off",
  restrictTo("Store Manager"),
  writeOffStock,
);

module.exports = router;