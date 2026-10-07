const pool = require("../config/db");
const { isAdministratorRole } = require("../middleware/AuthMiddleware");
const { message, notification } = require("../models");

// =========================================================
// MESSAGE CONTROLLER
// =========================================================

const messageController = {
  // =========================================================
  // SEND MESSAGE
  //
  // ATOMIC TRANSACTION
  //
  // Message + notification are committed together.
  //
  // If either operation fails:
  //     ROLLBACK
  //
  // The sender is ALWAYS taken from req.user.
  // The frontend cannot choose who the sender is.
  // =========================================================

  async sendMessage(req, res) {
    const client = await pool.connect();

    try {
      const { recipientId, subject, body, parentMessageId = null } = req.body;

      const sender = req.user;

      // =====================================================
      // NORMALIZE AUTHENTICATED USER ROLE
      // =====================================================

      const senderRole = sender.role_name || sender.role || null;

      if (!sender || !sender.id) {
        return res.status(401).json({
          success: false,
          message: "Authenticated user not found.",
        });
      }

      // =====================================================
      // BASIC VALIDATION
      // =====================================================

      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: "Recipient is required.",
        });
      }

      if (typeof subject !== "string" || !subject.trim()) {
        return res.status(400).json({
          success: false,
          message: "Subject is required.",
        });
      }

      if (typeof body !== "string" || !body.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message body is required.",
        });
      }

      // =====================================================
      // VERIFY SENDER ROLE
      // =====================================================

      if (
        !["Administrator", "Directorate", "Staff", "Store Manager"].includes(
          senderRole,
        )
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to use messaging.",
        });
      }

      // =====================================================
      // FIND RECIPIENT
      // =====================================================

      const recipientResult = await client.query(
        `
          SELECT
            u.id,
            u.full_name,
            u.email,
            u.is_active,
            r.name AS role

          FROM users u

          JOIN roles r
            ON r.id = u.role_id

          WHERE u.id = $1
          `,
        [recipientId],
      );

      const recipient = recipientResult.rows[0];

      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: "Recipient not found.",
        });
      }

      if (!recipient.is_active) {
        return res.status(400).json({
          success: false,
          message: "Recipient is inactive.",
        });
      }

      // =====================================================
      // PREVENT SELF-MESSAGING
      // =====================================================

      if (sender.id === recipient.id) {
        return res.status(400).json({
          success: false,
          message: "You cannot send a message to yourself.",
        });
      }

      // =====================================================
      // MESSAGING AUTHORIZATION
      //
      // Staff
      // Store Manager
      //     ↓
      // Administrator only
      //
      // Administrator
      //     ↓
      // Staff / Store Manager
      // =====================================================

      if (
        !isAdministratorRole(senderRole) &&
        !isAdministratorRole(recipient.role)
      ) {
        return res.status(403).json({
          success: false,
          message: "You may only send messages to an Administrator.",
        });
      }

      // =====================================================
      // OPTIONAL PARENT MESSAGE VALIDATION
      //
      // Used when replying.
      //
      // The sender must be one of the participants in the
      // original message.
      // =====================================================

      if (parentMessageId) {
        const parentResult = await client.query(
          `
            SELECT
              id,
              sender_id,
              recipient_id
            FROM messages
            WHERE id = $1
            `,
          [parentMessageId],
        );

        const parentMessage = parentResult.rows[0];

        if (!parentMessage) {
          return res.status(404).json({
            success: false,
            message: "Parent message not found.",
          });
        }

        const isParticipant =
          parentMessage.sender_id === sender.id ||
          parentMessage.recipient_id === sender.id;

        if (!isParticipant) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to reply to this message.",
          });
        }
      }

      // =====================================================
      // BEGIN ATOMIC TRANSACTION
      // =====================================================

      await client.query("BEGIN");

      // =====================================================
      // 1. INSERT MESSAGE
      // =====================================================

      const messageResult = await client.query(
        `
          INSERT INTO messages (
            sender_id,
            recipient_id,
            parent_message_id,
            subject,
            body
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          RETURNING
            id,
            sender_id,
            recipient_id,
            parent_message_id,
            subject,
            body,
            is_read,
            created_at
          `,
        [sender.id, recipient.id, parentMessageId, subject.trim(), body.trim()],
      );

      const createdMessage = messageResult.rows[0];

      // =====================================================
      // 2. CREATE NOTIFICATION
      //
      // SAME TRANSACTION CLIENT
      // =====================================================

      await notification.createWithClient({
        client,

        userId: recipient.id,

        title: "New message",

        message: `${sender.full_name || "A system user"} sent you a message: "${subject.trim()}".`,
      });

      // =====================================================
      // 3. COMMIT
      // =====================================================

      await client.query("COMMIT");

      // =====================================================
      // SUCCESS
      // =====================================================

      return res.status(201).json({
        success: true,
        message: "Message sent successfully.",
        data: createdMessage,
      });
    } catch (error) {
      // =====================================================
      // ROLLBACK
      // =====================================================

      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("[Message] rollback failed:", rollbackError);
      }

      console.error("[Message] sendMessage:", error);

      const errors = {
        SENDER_REQUIRED: [400, "Sender is required."],

        RECIPIENT_REQUIRED: [400, "Recipient is required."],

        CANNOT_MESSAGE_SELF: [400, "You cannot send a message to yourself."],

        SUBJECT_REQUIRED: [400, "Subject is required."],

        MESSAGE_BODY_REQUIRED: [400, "Message body is required."],

        DATABASE_CLIENT_REQUIRED: [
          500,
          "Database transaction could not be established.",
        ],

        NOTIFICATION_USER_REQUIRED: [
          500,
          "Message notification could not be created.",
        ],

        NOTIFICATION_TITLE_REQUIRED: [
          500,
          "Message notification could not be created.",
        ],

        NOTIFICATION_MESSAGE_REQUIRED: [
          500,
          "Message notification could not be created.",
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
        message: "Message could not be sent.",
      });
    } finally {
      client.release();
    }
  },

  // =========================================================
  // INBOX
  // =========================================================

  async getInbox(req, res) {
    try {
      const messages = await message.findInbox(req.user.id);

      return res.status(200).json({
        success: true,
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      console.error("[Message] getInbox:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // SENT
  // =========================================================

  async getSent(req, res) {
    try {
      const messages = await message.findSent(req.user.id);

      return res.status(200).json({
        success: true,
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      console.error("[Message] getSent:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // GET ONE MESSAGE
  // =========================================================

  async getMessage(req, res) {
    try {
      const found = await message.findById(req.params.id, req.user.id);

      if (!found) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: found,
      });
    } catch (error) {
      console.error("[Message] getMessage:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // MARK AS READ
  // =========================================================

  async markAsRead(req, res) {
    try {
      const updated = await message.markAsRead(req.params.id, req.user.id);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      console.error("[Message] markAsRead:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  async getUnreadCount(req, res) {
    try {
      const count = await message.countUnread(req.user.id);

      return res.status(200).json({
        success: true,
        data: {
          count,
        },
      });
    } catch (error) {
      console.error("[Message] getUnreadCount:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },

  // =========================================================
  // GET ALLOWED MESSAGE RECIPIENTS
  // =========================================================

  async getRecipients(req, res) {
    try {
      const sender = req.user;

      const senderRole = sender.role_name || sender.role || null;

      // =====================================================
      // DETERMINE ALLOWED RECIPIENT ROLES
      // =====================================================

      let allowedRoles = [];

      if (isAdministratorRole(senderRole)) {
        allowedRoles = ["Staff", "Store Manager"];
      } else if (senderRole === "Directorate") {
        allowedRoles = ["Administrator"];
      } else if (senderRole === "Staff" || senderRole === "Store Manager") {
        allowedRoles = ["Administrator", "Directorate"];
      } else {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to use messaging.",
        });
      }

      // =====================================================
      // GET ACTIVE USERS ONLY
      // =====================================================

      const result = await pool.query(
        `
          SELECT
            u.id,
            u.full_name,
            u.email,
            r.name AS role,
            d.name AS department

          FROM users u

          JOIN roles r
            ON r.id = u.role_id

          LEFT JOIN departments d
            ON d.id = u.department_id

          WHERE
            u.is_active = TRUE
            AND r.name = ANY($1::VARCHAR[])
            AND u.id <> $2

          ORDER BY
            u.full_name ASC
          `,
        [allowedRoles, sender.id],
      );

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows,
      });
    } catch (error) {
      console.error("[Message] getRecipients:", error);

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  },
};

module.exports = messageController;
