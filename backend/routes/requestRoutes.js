const express = require("express");

const {
  createRequest,
  getMyRequests,
  getRequest,
  getAllRequests,
  getRequestsForIssuance,
  approveRequest,
  rejectRequest,
} = require("../controllers/requestController");

const {
  protect,
  restrictTo,
  ROLES,
} = require("../middleware/AuthMiddleware");

const router = express.Router();

// =========================================================
// ADMINISTRATOR: ALL REQUESTS
// =========================================================

router.get(
  "/",
  protect,
  restrictTo(ROLES.ADMINISTRATOR),
  getAllRequests,
);

// =========================================================
// STAFF: OWN REQUESTS
// =========================================================

router.get(
  "/mine",
  protect,
  restrictTo(ROLES.STAFF),
  getMyRequests,
);

// =========================================================
// STAFF: CREATE REQUEST
// =========================================================

router.post(
  "/",
  protect,
  restrictTo(ROLES.STAFF),
  createRequest,
);

// =========================================================
// STORE MANAGER: REQUESTS READY FOR ISSUANCE
//
// IMPORTANT:
// This MUST appear before /:id.
//
// Otherwise "/for-issuance" gets interpreted as:
//     id = "for-issuance"
// and getRequest() attempts a UUID lookup.
// =========================================================

router.get(
  "/for-issuance",
  protect,
  restrictTo(ROLES.STORE_MANAGER),
  getRequestsForIssuance,
);

// =========================================================
// ADMINISTRATOR: APPROVE
// =========================================================

router.patch(
  "/:id/approve",
  protect,
  restrictTo(ROLES.ADMINISTRATOR),
  approveRequest,
);

// =========================================================
// ADMINISTRATOR: REJECT
// =========================================================

router.patch(
  "/:id/reject",
  protect,
  restrictTo(ROLES.ADMINISTRATOR),
  rejectRequest,
);

// =========================================================
// VIEW ONE REQUEST
//
// Authorization is handled inside getRequest():
//
// Administrator:
//   any request
//
// Requester:
//   own request
//
// Store Manager:
//   APPROVED / PARTIALLY_APPROVED requests
//
// Others:
//   denied
// =========================================================

router.get(
  "/:id",
  protect,
  getRequest,
);

module.exports = router;