const itemReturn = require("../models/itemReturn");

// =========================================================
// RETURN INVENTORY
// Store Manager only
// =========================================================

const returnInventory = async (req, res) => {
  try {
    const { quantityReturned, conditionStatus, remarks } = req.body;

    // -------------------------------------------------------
    // BASIC REQUEST VALIDATION
    // -------------------------------------------------------

    if (!Number.isInteger(quantityReturned) || quantityReturned <= 0) {
      return res.status(400).json({
        success: false,
        message: "Return quantity must be a positive whole number.",
      });
    }

    // -------------------------------------------------------
    // EXECUTE RETURN TRANSACTION
    // -------------------------------------------------------

    const result = await itemReturn.create({
      issuedItemId: req.params.issuedItemId,

      quantityReturned,

      conditionStatus,

      remarks,

      performedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Inventory returned successfully.",
      data: result,
    });
  } catch (error) {
    console.error("[Return] returnInventory:", error);

    // =======================================================
    // KNOWN BUSINESS / VALIDATION ERRORS
    // =======================================================

    const errors = {
      INVALID_RETURN_QUANTITY: [
        400,
        "Return quantity must be a positive whole number.",
      ],

      PERFORMED_BY_REQUIRED: [400, "Returning user is required."],

      ISSUED_ITEM_ID_REQUIRED: [400, "Issued item is required."],

      ISSUED_ITEM_NOT_FOUND: [404, "Issued item not found."],

      ITEM_NOT_FOUND: [404, "Inventory item not found."],

      ITEM_INACTIVE: [400, "Inventory item is inactive."],

      INVALID_ISSUED_QUANTITY: [
        409,
        "The issued inventory record contains an invalid quantity.",
      ],

      ISSUED_ITEM_ALREADY_RETURNED: [
        409,
        "This issued item has already been fully returned.",
      ],

      RETURN_EXCEEDS_ISSUED_QUANTITY: [
        400,
        "Return quantity exceeds the remaining issued quantity.",
      ],

      RETURN_HISTORY_EXCEEDS_ISSUED_QUANTITY: [
        409,
        "Return history is inconsistent with the issued quantity.",
      ],

      INVENTORY_STATE_INCONSISTENT: [
        409,
        "Inventory state is inconsistent. The return was rejected.",
      ],

      INVENTORY_UPDATE_FAILED: [500, "Inventory could not be updated."],
    };

    const known = errors[error.message];

    if (known) {
      return res.status(known[0]).json({
        success: false,
        message: known[1],
      });
    }

    // =======================================================
    // UNKNOWN SERVER ERROR
    // =======================================================

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// GET RETURNS FOR ISSUED ITEM
// Store Manager only
// =========================================================

const getReturnsByIssuedItem = async (req, res) => {
  try {
    const returns = await itemReturn.findByIssuedItemId(
      req.params.issuedItemId,
    );

    return res.status(200).json({
      success: true,
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    console.error("[Return] getReturnsByIssuedItem:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  returnInventory,
  getReturnsByIssuedItem,
};
