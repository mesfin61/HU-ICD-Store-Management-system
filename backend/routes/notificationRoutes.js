const express = require("express");

const notificationController = require("../controllers/notificationController");

const { protect } = require("../middleware/AuthMiddleware");

const router = express.Router();

// =========================================================
// ALL NOTIFICATION ROUTES REQUIRE LOGIN
// =========================================================

router.use(protect);

// =========================================================
// GET MY NOTIFICATIONS
// =========================================================

router.get("/", notificationController.getMyNotifications);

// =========================================================
// GET UNREAD COUNT
// =========================================================

router.get("/unread-count", notificationController.getUnreadCount);

// =========================================================
// MARK ALL AS READ
// =========================================================

router.patch("/read-all", notificationController.markAllAsRead);

// =========================================================
// GET ONE
// =========================================================

router.get("/:id", notificationController.getNotification);

// =========================================================
// MARK ONE AS READ
// =========================================================

router.patch("/:id/read", notificationController.markAsRead);

// =========================================================
// DELETE ONE
// =========================================================

router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
