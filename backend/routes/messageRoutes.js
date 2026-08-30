const express = require("express");

const {
  protect,
} = require("../middleware/AuthMiddleware");

const messageController =
  require("../controllers/messageController");

const router =
  express.Router();

router.use(protect);

router.get(
  "/inbox",
  messageController.getInbox,
);

router.get(
  "/sent",
  messageController.getSent,
);

router.get(
  "/unread-count",
  messageController.getUnreadCount,
);

router.get(
  "/recipients",
  messageController.getRecipients,
);

router.get(
  "/:id",
  messageController.getMessage,
);

router.patch(
  "/:id/read",
  messageController.markAsRead,
);

router.post(
  "/",
  messageController.sendMessage,
);

module.exports = router;