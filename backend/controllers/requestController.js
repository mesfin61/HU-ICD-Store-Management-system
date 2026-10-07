const { request } = require("../models");
const {
  isAdministratorRole,
  isDirectorateRole,
} = require("../middleware/AuthMiddleware");

// =========================================================
// STAFF: CREATE REQUEST
// =========================================================

const createRequest = async (req, res) => {
  try {
    const { purpose, items } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    if (!req.user.department_id) {
      return res.status(400).json({
        success: false,
        message: "You must belong to a department before creating a request.",
      });
    }

    if (typeof purpose !== "string" || !purpose.trim()) {
      return res.status(400).json({
        success: false,
        message: "A reason for the request is required.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required.",
      });
    }

    const normalizedItems = items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
    }));

    const createdRequest = await request.create({
      requesterId: req.user.id,
      departmentId: req.user.department_id,
      purpose: purpose.trim(),
      items: normalizedItems,
    });

    const requestItems = await request.findItems(createdRequest.id);

    return res.status(201).json({
      success: true,
      message: "Request submitted successfully.",
      data: {
        ...createdRequest,
        requesterName: req.user.full_name,
        departmentName: req.user.department_name,
        items: requestItems,
      },
    });
  } catch (error) {
    console.error("[Request] createRequest:", error);

    const errors = {
      REQUESTER_NOT_FOUND: [404, "Requester not found."],

      REQUESTER_INACTIVE: [403, "Your account is inactive."],

      INVALID_REQUEST_DEPARTMENT: [
        400,
        "Your department information is invalid.",
      ],

      INVALID_REQUEST_PURPOSE: [400, "A reason for the request is required."],

      REQUEST_ITEMS_REQUIRED: [400, "At least one item is required."],

      INVALID_REQUEST_ITEMS: [400, "Invalid or duplicate request items."],

      INVALID_REQUEST_QUANTITY: [
        400,
        "Requested quantity must be a positive whole number.",
      ],

      ITEM_NOT_FOUND: [404, "One or more requested items do not exist."],

      ITEM_INACTIVE: [400, "One or more requested items are inactive."],

      INSUFFICIENT_STOCK: [
        400,
        "Requested quantity exceeds the available stock for one or more items.",
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
// STAFF: OWN REQUESTS
// =========================================================

const getMyRequests = async (req, res) => {
  try {
    const requests = await request.findByRequester(req.user.id);

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("[Request] getMyRequests:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// GET ONE REQUEST
// =========================================================
//
// Administrator:
//   Can view any request.
//
// Requester:
//   Can view their own request.
//
// Store Manager:
//   Can view approved/partially-approved requests.
//   This is necessary for issuance.
//
// =========================================================

const getRequest = async (req, res) => {
  try {
    const foundRequest = await request.findById(req.params.id);

    if (!foundRequest) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    const canViewBusinessRequest =
      isAdministratorRole(req.user.role_name) ||
      isDirectorateRole(req.user.role_name);

    const isRequester = foundRequest.requester_id === req.user.id;

    const isStoreManager = req.user.role_name === "Store Manager";

    const managerCanView =
      isStoreManager &&
      (foundRequest.status === "APPROVED" ||
        foundRequest.status === "PARTIALLY_APPROVED");

    if (!canViewBusinessRequest && !isRequester && !managerCanView) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const items = await request.findItems(foundRequest.id);

    return res.status(200).json({
      success: true,
      data: {
        ...foundRequest,
        items,
      },
    });
  } catch (error) {
    console.error("[Request] getRequest:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// ADMINISTRATOR: ALL REQUESTS
// =========================================================

const getAllRequests = async (req, res) => {
  try {
    const requests = await request.findAll();

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("[Request] getAllRequests:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

const getRequestsForIssuance = async (req, res) => {
  try {
    const requests = await request.findReadyForIssuance();

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("[Request] getRequestsForIssuance:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// ADMINISTRATOR: APPROVE
// =========================================================
//
// IMPORTANT:
//
// The controller only asks the model to approve.
//
// The model automatically performs:
//
// APPROVAL
//   -> RESERVATION
//   -> STOCK REDUCTION
//   -> INVENTORY LEDGER
//
// inside one transaction.
//
// No Store Manager action is involved here.
// =========================================================

const approveRequest = async (req, res) => {
  try {
    const { approvedItems } = req.body;

    if (!Array.isArray(approvedItems) || approvedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Approved quantities are required for all request items.",
      });
    }

    const updatedRequest = await request.approve({
      requestId: req.params.id,
      administratorId: req.user.id,
      approvedItems,
    });

    const items = await request.findItems(updatedRequest.id);

    return res.status(200).json({
      success: true,
      message:
        updatedRequest.status === "REJECTED"
          ? "Request rejected."
          : "Request approved and inventory reserved successfully.",
      data: {
        ...updatedRequest,
        items,
      },
    });
  } catch (error) {
    console.error("[Request] approveRequest:", error);

    const errors = {
      REQUEST_NOT_FOUND: [404, "Request not found."],

      SELF_APPROVAL_FORBIDDEN: [403, "You cannot approve your own request."],

      REQUEST_ALREADY_DECIDED: [409, "This request has already been decided."],

      APPROVED_ITEMS_REQUIRED: [400, "Approved quantities are required."],

      INVALID_REQUEST_ITEM: [400, "An invalid request item was supplied."],

      DUPLICATE_APPROVED_ITEM: [
        400,
        "A request item was supplied more than once.",
      ],

      INVALID_APPROVED_QUANTITY: [
        400,
        "Approved quantity must be a non-negative whole number.",
      ],

      APPROVED_QUANTITY_EXCEEDS_REQUEST: [
        400,
        "Approved quantity cannot exceed requested quantity.",
      ],

      ALL_REQUEST_ITEMS_MUST_BE_DECIDED: [
        400,
        "Every requested item must receive an approval quantity.",
      ],

      REQUEST_ITEM_NOT_FOUND: [
        400,
        "An approved request item could not be found.",
      ],

      RESERVATION_EXCEEDS_APPROVED_QUANTITY: [
        400,
        "Reservation exceeds the approved quantity.",
      ],

      APPROVED_QUANTITY_ALREADY_RESERVED: [
        409,
        "The approved quantity has already been reserved.",
      ],

      ITEM_NOT_FOUND: [404, "An approved inventory item could not be found."],

      ITEM_INACTIVE: [400, "An approved inventory item is inactive."],

      INSUFFICIENT_STOCK: [
        409,
        "Insufficient available stock to reserve the approved quantity. The approval was not completed.",
      ],

      INVALID_RESERVATION_QUANTITY: [400, "Invalid reservation quantity."],

      PERFORMED_BY_REQUIRED: [
        400,
        "The administrator performing the approval is required.",
      ],

      DATABASE_CLIENT_REQUIRED: [500, "Database transaction error."],
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
// ADMINISTRATOR: REJECT
// =========================================================

const rejectRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const updatedRequest = await request.reject({
      requestId: req.params.id,
      administratorId: req.user.id,
      rejectionReason,
    });

    const items = await request.findItems(updatedRequest.id);

    return res.status(200).json({
      success: true,
      message: "Request rejected successfully.",
      data: {
        ...updatedRequest,
        items,
      },
    });
  } catch (error) {
    console.error("[Request] rejectRequest:", error);

    const errors = {
      REQUEST_NOT_FOUND: [404, "Request not found."],

      SELF_REJECTION_FORBIDDEN: [403, "You cannot reject your own request."],

      REQUEST_ALREADY_DECIDED: [409, "This request has already been decided."],

      REJECTION_REASON_REQUIRED: [400, "A rejection reason is required."],
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

module.exports = {
  createRequest,
  getMyRequests,
  getRequest,
  getAllRequests,
  getRequestsForIssuance,
  approveRequest,
  rejectRequest,
};
