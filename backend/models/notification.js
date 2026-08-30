const pool = require("../config/db");

const notification = {
  // =========================================================
  // CREATE NOTIFICATION
  // =========================================================
  //
  // Notifications are created by business operations.
  //
  // Example:
  //   REQUEST_CREATED
  //   REQUEST_APPROVED
  //   REQUEST_REJECTED
  //   INVENTORY_RESERVED
  //   ITEM_ISSUED
  //   ITEM_RETURNED
  //
  // The notification itself is NOT the audit trail.
  // audit_logs remains the permanent accountability record.
  // =========================================================

  async create({
    userId,
    title,
    message,
  }) {
    if (!userId) {
      throw new Error("NOTIFICATION_USER_REQUIRED");
    }

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      throw new Error("NOTIFICATION_TITLE_REQUIRED");
    }

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      throw new Error("NOTIFICATION_MESSAGE_REQUIRED");
    }

    const result = await pool.query(
      `
      INSERT INTO notifications (
        user_id,
        title,
        message
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        user_id,
        title,
        message,
        is_read,
        created_at
      `,
      [
        userId,
        title.trim(),
        message.trim(),
      ],
    );

    return result.rows[0];
  },

  // =========================================================
  // CREATE NOTIFICATION USING EXISTING TRANSACTION
  // =========================================================
  //
  // This is the important method for business operations.
  //
  // If a request approval, issuance, return, etc. happens
  // inside a database transaction, the notification can use
  // the SAME client.
  //
  // Therefore:
  //
  // BUSINESS OPERATION
  //       +
  // AUDIT LOG
  //       +
  // NOTIFICATION
  //       +
  // OTHER DATABASE CHANGES
  //       ↓
  //     COMMIT
  //
  // If the transaction rolls back, the notification rolls
  // back too.
  // =========================================================

  async createWithClient({
    client,
    userId,
    title,
    message,
  }) {
    if (!client) {
      throw new Error("DATABASE_CLIENT_REQUIRED");
    }

    if (!userId) {
      throw new Error("NOTIFICATION_USER_REQUIRED");
    }

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      throw new Error("NOTIFICATION_TITLE_REQUIRED");
    }

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      throw new Error("NOTIFICATION_MESSAGE_REQUIRED");
    }

    const result = await client.query(
      `
      INSERT INTO notifications (
        user_id,
        title,
        message
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        user_id,
        title,
        message,
        is_read,
        created_at
      `,
      [
        userId,
        title.trim(),
        message.trim(),
      ],
    );

    return result.rows[0];
  },

  // =========================================================
  // GET USER NOTIFICATIONS
  // =========================================================

  async findByUserId(
    userId,
    {
      limit = 50,
      offset = 0,
      unreadOnly = false,
    } = {},
  ) {
    const safeLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      100,
    );

    const safeOffset = Math.max(
      Number(offset) || 0,
      0,
    );

    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        title,
        message,
        is_read,
        created_at

      FROM notifications

      WHERE
        user_id = $1
        AND
        ($2::BOOLEAN = FALSE OR is_read = FALSE)

      ORDER BY
        created_at DESC,
        id DESC

      LIMIT $3
      OFFSET $4
      `,
      [
        userId,
        unreadOnly,
        safeLimit,
        safeOffset,
      ],
    );

    return result.rows;
  },

  // =========================================================
  // GET ONE NOTIFICATION
  // =========================================================

  async findById(id, userId) {
    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        title,
        message,
        is_read,
        created_at

      FROM notifications

      WHERE
        id = $1
        AND user_id = $2
      `,
      [id, userId],
    );

    return result.rows[0] || null;
  },

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  async countUnread(userId) {
    const result = await pool.query(
      `
      SELECT COUNT(*)::INTEGER AS count

      FROM notifications

      WHERE
        user_id = $1
        AND is_read = FALSE
      `,
      [userId],
    );

    return result.rows[0].count;
  },

  // =========================================================
  // MARK ONE AS READ
  // =========================================================
  //
  // userId is deliberately required.
  //
  // A user must never be able to mark/read another user's
  // notification through the notification model.
  // =========================================================

  async markAsRead(id, userId) {
    const result = await pool.query(
      `
      UPDATE notifications

      SET
        is_read = TRUE

      WHERE
        id = $1
        AND user_id = $2

      RETURNING
        id,
        user_id,
        title,
        message,
        is_read,
        created_at
      `,
      [id, userId],
    );

    return result.rows[0] || null;
  },

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  async markAllAsRead(userId) {
    const result = await pool.query(
      `
      UPDATE notifications

      SET
        is_read = TRUE

      WHERE
        user_id = $1
        AND is_read = FALSE

      RETURNING id
      `,
      [userId],
    );

    return result.rows.length;
  },

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================
  //
  // For now, keep deletion restricted to the notification
  // owner. We can remove this endpoint entirely if the final
  // system requires notifications to be permanent.
  // =========================================================

  async deleteById(id, userId) {
    const result = await pool.query(
      `
      DELETE FROM notifications

      WHERE
        id = $1
        AND user_id = $2

      RETURNING id
      `,
      [id, userId],
    );

    return result.rows[0] || null;
  },
};

module.exports = notification;