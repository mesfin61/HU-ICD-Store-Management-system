const issuance = require("../models/issuance");

// =========================================================
// STORE MANAGER: ISSUE RESERVED INVENTORY
// =========================================================

const issueInventory = async (req, res) => {
  try {
    const { requestItemId, quantity, dueDate } = req.body;

    if (!requestItemId) {
      return res.status(400).json({
        success: false,
        message: "Request item ID is required.",
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Issue quantity must be a positive whole number.",
      });
    }

    const result = await issuance.issue({
      requestId: req.params.requestId,
      requestItemId,
      quantity,
      issuedBy: req.user.id,
      dueDate,
    });

    return res.status(200).json({
      success: true,
      message: "Inventory issued successfully.",
      data: result,
    });
  } catch (error) {
    console.error("[Issuance] issueInventory:", error);

    const errors = {
      INVALID_ISSUE_QUANTITY: [
        400,
        "Issue quantity must be a positive whole number.",
      ],

      ISSUED_BY_REQUIRED: [400, "Issuing user is required."],

      REQUEST_NOT_FOUND: [404, "Request not found."],

      REQUEST_NOT_READY_FOR_ISSUANCE: [
        409,
        "This request is not ready for issuance.",
      ],

      REQUEST_ITEM_NOT_FOUND: [404, "Request item not found."],

      ITEM_NOT_FOUND: [404, "Inventory item not found."],

      ITEM_INACTIVE: [400, "Inventory item is inactive."],

      REQUEST_ITEM_ALREADY_ISSUED: [
        409,
        "This request item has already been fully issued.",
      ],

      ISSUE_EXCEEDS_REMAINING_APPROVED: [
        400,
        "Issue quantity exceeds the remaining approved quantity.",
      ],

      INSUFFICIENT_RESERVED_QUANTITY: [
        409,
        "Insufficient reserved quantity for this request item.",
      ],
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
// GET ISSUANCES FOR REQUEST
// =========================================================

const getIssuancesByRequest = async (req, res) => {
  try {
    const issuances = await issuance.findByRequestId(req.params.requestId);

    return res.status(200).json({
      success: true,
      count: issuances.length,
      data: issuances,
    });
  } catch (error) {
    console.error("[Issuance] getIssuancesByRequest:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const getOutstandingIssuedItems = async (req, res) => {
  try {
    const items = await issuance.findOutstandingIssuedItems();

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("[Issuance] getOutstandingIssuedItems:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// STAFF: GET MY OUTSTANDING ISSUED INVENTORY
// =========================================================

const getMyOutstandingIssuedItems = async (req, res) => {
  try {
    const items = await issuance.findMyOutstandingIssuedItems(req.user.id);

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("[Issuance] getMyOutstandingIssuedItems:", error);

    if (error.message === "USER_ID_REQUIRED") {
      return res.status(400).json({
        success: false,
        message: "Authenticated user is required.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

module.exports = {
  issueInventory,
  getIssuancesByRequest,
  getOutstandingIssuedItems,
  getMyOutstandingIssuedItems,
};
