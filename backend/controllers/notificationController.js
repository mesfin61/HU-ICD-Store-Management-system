const { notification } = require("../models");

const notificationController = {
  // =========================================================
  // GET MY NOTIFICATIONS
  // =========================================================

  async getMyNotifications(req, res) {
    try {
      const { limit = 50, offset = 0, unreadOnly = "false" } = req.query;

      const notifications = await notification.findByUserId(req.user.id, {
        limit,
        offset,
        unreadOnly: String(unreadOnly).toLowerCase() === "true",
      });

      return res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications,
      });
    } catch (error) {
      console.error("[Notification] getMyNotifications:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // GET UNREAD COUNT
  // =========================================================

  async getUnreadCount(req, res) {
    try {
      const count = await notification.countUnread(req.user.id);

      return res.status(200).json({
        success: true,
        data: {
          count,
        },
      });
    } catch (error) {
      console.error("[Notification] getUnreadCount:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // GET ONE
  // =========================================================

  async getNotification(req, res) {
    try {
      const found = await notification.findById(req.params.id, req.user.id);

      if (!found) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: found,
      });
    } catch (error) {
      console.error("[Notification] getNotification:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // MARK ONE AS READ
  // =========================================================

  async markAsRead(req, res) {
    try {
      const updated = await notification.markAsRead(req.params.id, req.user.id);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification marked as read.",
        data: updated,
      });
    } catch (error) {
      console.error("[Notification] markAsRead:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  async markAllAsRead(req, res) {
    try {
      const count = await notification.markAllAsRead(req.user.id);

      return res.status(200).json({
        success: true,
        message: "All notifications marked as read.",
        data: {
          count,
        },
      });
    } catch (error) {
      console.error("[Notification] markAllAsRead:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // DELETE ONE
  // =========================================================

  async deleteNotification(req, res) {
    try {
      const deleted = await notification.deleteById(req.params.id, req.user.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification deleted.",
      });
    } catch (error) {
      console.error("[Notification] deleteNotification:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },
};

module.exports = notificationController;
