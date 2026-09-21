const { inventoryItem, inventoryReservationException } = require("../models");

// =========================================================
// CREATE INVENTORY ITEM
// Store Manager only
// =========================================================

const createItem = async (req, res) => {
  try {
    const {
      itemCode,
      name,
      categoryId,
      description,
      unit,
      minimumStock,
      initialQuantity,
      isAsset,
      vendor,
      referenceNo,
      remarks,
    } = req.body;

    if (typeof itemCode !== "string" || !itemCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Item code is required.",
      });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Item name is required.",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    const parsedMinimumStock =
      minimumStock === undefined || minimumStock === null || minimumStock === ""
        ? 0
        : Number(minimumStock);

    const parsedInitialQuantity =
      initialQuantity === undefined ||
      initialQuantity === null ||
      initialQuantity === ""
        ? 0
        : Number(initialQuantity);

    if (!Number.isInteger(parsedMinimumStock) || parsedMinimumStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Minimum stock must be a non-negative whole number.",
      });
    }

    if (!Number.isInteger(parsedInitialQuantity) || parsedInitialQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Initial quantity must be a non-negative whole number.",
      });
    }

    const item = await inventoryItem.create({
      itemCode,
      name,
      categoryId,
      description,
      unit,
      minimumStock: parsedMinimumStock,
      initialQuantity: parsedInitialQuantity,
      isAsset: isAsset === true,
      performedBy: req.user.id,
      vendor,
      referenceNo,
      remarks,
    });

    return res.status(201).json({
      success: true,
      message: "Inventory item registered successfully.",
      data: item,
    });
  } catch (error) {
    console.error("[Inventory] createItem error:", error);

    const errors = {
      PERFORMED_BY_REQUIRED: [400, "Registering user is required."],

      ITEM_CODE_REQUIRED: [400, "Item code is required."],

      ITEM_NAME_REQUIRED: [400, "Item name is required."],

      CATEGORY_REQUIRED: [400, "Category is required."],

      CATEGORY_NOT_FOUND: [404, "Selected category does not exist."],

      ITEM_CODE_ALREADY_EXISTS: [
        409,
        "An inventory item with this item code already exists.",
      ],

      INVALID_MINIMUM_STOCK: [
        400,
        "Minimum stock must be a non-negative whole number.",
      ],

      INVALID_INITIAL_QUANTITY: [
        400,
        "Initial quantity must be a non-negative whole number.",
      ],

      INVALID_ASSET_FLAG: [400, "Invalid asset classification."],
    };

    const known = errors[error.message];

    if (known) {
      return res.status(known[0]).json({
        success: false,
        message: known[1],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// GET ALL INVENTORY ITEMS
// =========================================================

const getAllItems = async (req, res) => {
  try {
    const items = await inventoryItem.findAll();

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("[Inventory] getAllItems error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// GET INVENTORY ITEM BY ID
// =========================================================

const getItemById = async (req, res) => {
  try {
    const item = await inventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("[Inventory] getItemById error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// RECEIVE STOCK
// Store Manager only
// =========================================================

const receiveStock = async (req, res) => {
  try {
    const { quantity, referenceNo, remarks } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer.",
      });
    }

    const item = await inventoryItem.receiveStock({
      itemId: req.params.id,
      quantity,
      performedBy: req.user.id,
      referenceNo,
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Stock received successfully.",
      data: item,
    });
  } catch (error) {
    console.error("[Inventory] receiveStock error:", error.message);

    if (error.message === "ITEM_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    if (error.message === "ITEM_INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Inventory item is inactive.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// ADJUST STOCK IN
// Store Manager only
// =========================================================

const adjustStockIn = async (req, res) => {
  try {
    const { quantity, referenceNo, remarks } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer.",
      });
    }

    const item = await inventoryItem.adjustStockIn({
      itemId: req.params.id,
      quantity,
      performedBy: req.user.id,
      referenceNo,
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Stock adjusted in successfully.",
      data: item,
    });
  } catch (error) {
    console.error("[Inventory] adjustStockIn error:", error.message);

    if (error.message === "ITEM_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    if (error.message === "ITEM_INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Inventory item is inactive.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// ADJUST STOCK OUT
// Store Manager only
// =========================================================

const adjustStockOut = async (req, res) => {
  try {
    const { quantity, referenceNo, remarks } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer.",
      });
    }

    const item = await inventoryItem.adjustStockOut({
      itemId: req.params.id,
      quantity,
      performedBy: req.user.id,
      referenceNo,
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Stock adjusted out successfully.",
      data: item,
    });
  } catch (error) {
    console.error("[Inventory] adjustStockOut error:", error.message);

    if (error.message === "ITEM_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    if (error.message === "ITEM_INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Inventory item is inactive.",
      });
    }

    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        success: false,
        message: "Insufficient available stock.",
      });
    }

    if (error.message === "INSUFFICIENT_PHYSICAL_STOCK") {
      return res.status(400).json({
        success: false,
        message: "Insufficient physical stock.",
      });
    }

    // -------------------------------------------------------
    // RESERVATION CONFLICT
    //
    // The model deliberately rejects this operation because
    // part of the requested stock is already committed to
    // reservations.
    //
    // This is NOT a server error.
    //
    // HTTP 409 tells the frontend that the requested operation
    // conflicts with the current inventory state and must go
    // through the explicit override workflow.
    // -------------------------------------------------------

    if (error.message === "RESERVATION_CONFLICT") {
      return res.status(409).json({
        success: false,
        code: "RESERVATION_CONFLICT",
        message:
          "This operation would consume inventory already committed to existing reservations.",
        conflict: error.conflict || null,
        requiresOverride: true,
      });
    }

    if (error.message === "INVENTORY_STATE_INCONSISTENT") {
      return res.status(409).json({
        success: false,
        code: "INVENTORY_STATE_INCONSISTENT",
        message:
          "The inventory data is internally inconsistent and the operation cannot safely continue.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// WRITE OFF STOCK
// Store Manager only
// =========================================================

const writeOffStock = async (req, res) => {
  try {
    const { quantity, referenceNo, remarks } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer.",
      });
    }

    const item = await inventoryItem.writeOffStock({
      itemId: req.params.id,
      quantity,
      performedBy: req.user.id,
      referenceNo,
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Stock written off successfully.",
      data: item,
    });
  } catch (error) {
    console.error("[Inventory] writeOffStock error:", error.message);

    if (error.message === "ITEM_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    if (error.message === "ITEM_INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Inventory item is inactive.",
      });
    }

    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        success: false,
        message: "Insufficient available stock.",
      });
    }

    if (error.message === "INSUFFICIENT_PHYSICAL_STOCK") {
      return res.status(400).json({
        success: false,
        message: "Insufficient physical stock.",
      });
    }

    // -------------------------------------------------------
    // RESERVATION CONFLICT
    // -------------------------------------------------------

    if (error.message === "RESERVATION_CONFLICT") {
      return res.status(409).json({
        success: false,
        code: "RESERVATION_CONFLICT",
        message:
          "This write-off would consume inventory already committed to existing reservations.",
        conflict: error.conflict || null,
        requiresOverride: true,
      });
    }

    if (error.message === "INVENTORY_STATE_INCONSISTENT") {
      return res.status(409).json({
        success: false,
        code: "INVENTORY_STATE_INCONSISTENT",
        message:
          "The inventory data is internally inconsistent and the operation cannot safely continue.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  receiveStock,
  adjustStockIn,
  adjustStockOut,
  writeOffStock,
};
