const auditLog = require("../models/auditLog");

// =========================================================
// GET AUDIT LOGS
//
// ADMINISTRATOR ONLY
// =========================================================

const getAuditLogs = async (req, res) => {
  try {
    const { limit, offset, action, entityName, userId } = req.query;

    const logs = await auditLog.findAll({
      limit,
      offset,
      action: action || null,
      entityName: entityName || null,
      userId: userId || null,
    });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("[AuditLog] getAuditLogs:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// GET ONE AUDIT LOG
//
// ADMINISTRATOR ONLY
// =========================================================

const getAuditLogById = async (req, res) => {
  try {
    const log = await auditLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("[AuditLog] getAuditLogById:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// =========================================================
// GET CURRENT USER'S OWN HISTORY
//
// ALL AUTHENTICATED USERS
//
// IMPORTANT:
// req.user.id is the ONLY source of userId.
// =========================================================

const getMyAuditLogs = async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const logs = await auditLog.findForUser({
      userId: req.user.id,
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("[AuditLog] getMyAuditLogs:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getMyAuditLogs,
};
