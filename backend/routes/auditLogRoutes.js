const express = require("express");

const {
  protect,
  restrictTo,
} = require("../middleware/AuthMiddleware");

const {
  getAuditLogs,
  getAuditLogById,
  getMyAuditLogs,
} = require("../controllers/auditLogController");

const router = express.Router();

// =========================================================
// AUTHENTICATION
// =========================================================

router.use(protect);

// =========================================================
// MY HISTORY
//
// ALL AUTHENTICATED USERS
// =========================================================

router.get(
  "/mine",
  getMyAuditLogs,
);

// =========================================================
// ADMINISTRATOR AUDIT LOGS
// =========================================================

router.use(
  restrictTo("Administrator"),
);

router.get(
  "/",
  getAuditLogs,
);

router.get(
  "/:id",
  getAuditLogById,
);

module.exports = router;