const pool = require("../config/db");

const message = {
  // =========================================================
  // SEND MESSAGE
  // =========================================================

  async create({
    senderId,
    recipientId,
    subject,
    body,
    parentMessageId = null,
  }) {
    if (!senderId) {
      throw new Error("SENDER_REQUIRED");
    }

    if (!recipientId) {
      throw new Error("RECIPIENT_REQUIRED");
    }

    if (senderId === recipientId) {
      throw new Error("CANNOT_MESSAGE_SELF");
    }

    if (typeof subject !== "string" || !subject.trim()) {
      throw new Error("SUBJECT_REQUIRED");
    }

    if (typeof body !== "string" || !body.trim()) {
      throw new Error("MESSAGE_BODY_REQUIRED");
    }

    const result = await pool.query(
      `
      INSERT INTO messages (
        sender_id,
        recipient_id,
        parent_message_id,
        subject,
        body
      )
      VALUES ($1, $2, $3, $4, $5)
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
      [senderId, recipientId, parentMessageId, subject.trim(), body.trim()],
    );

    return result.rows[0];
  },

  // =========================================================
  // INBOX
  // =========================================================

  async findInbox(userId) {
    const result = await pool.query(
      `
      SELECT
        m.id,
        m.sender_id,
        sender.full_name AS sender_name,
        sender.email AS sender_email,

        m.recipient_id,
        recipient.full_name AS recipient_name,

        m.parent_message_id,
        m.subject,
        m.body,
        m.is_read,
        m.created_at

      FROM messages m

      JOIN users sender
        ON sender.id = m.sender_id

      JOIN users recipient
        ON recipient.id = m.recipient_id

      WHERE m.recipient_id = $1

      ORDER BY
        m.created_at DESC,
        m.id DESC
      `,
      [userId],
    );

    return result.rows;
  },

  // =========================================================
  // SENT
  // =========================================================

  async findSent(userId) {
    const result = await pool.query(
      `
      SELECT
        m.id,
        m.sender_id,
        sender.full_name AS sender_name,
        sender.email AS sender_email,

        m.recipient_id,
        recipient.full_name AS recipient_name,
        recipient.email AS recipient_email,

        m.parent_message_id,
        m.subject,
        m.body,
        m.is_read,
        m.created_at

      FROM messages m

      JOIN users sender
        ON sender.id = m.sender_id

      JOIN users recipient
        ON recipient.id = m.recipient_id

      WHERE m.sender_id = $1

      ORDER BY
        m.created_at DESC,
        m.id DESC
      `,
      [userId],
    );

    return result.rows;
  },

  // =========================================================
  // GET ONE MESSAGE
  // =========================================================

  async findById(id, userId) {
    const result = await pool.query(
      `
      SELECT
        m.id,
        m.sender_id,
        sender.full_name AS sender_name,
        sender.email AS sender_email,

        m.recipient_id,
        recipient.full_name AS recipient_name,
        recipient.email AS recipient_email,

        m.parent_message_id,
        m.subject,
        m.body,
        m.is_read,
        m.created_at

      FROM messages m

      JOIN users sender
        ON sender.id = m.sender_id

      JOIN users recipient
        ON recipient.id = m.recipient_id

      WHERE
        m.id = $1
        AND (
          m.sender_id = $2
          OR m.recipient_id = $2
        )
      `,
      [id, userId],
    );

    return result.rows[0] || null;
  },

  // =========================================================
  // MARK AS READ
  // =========================================================

  async markAsRead(id, userId) {
    const result = await pool.query(
      `
      UPDATE messages
      SET
        is_read = TRUE
      WHERE
        id = $1
        AND recipient_id = $2
      RETURNING
        id,
        sender_id,
        recipient_id,
        subject,
        body,
        is_read,
        created_at
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
      FROM messages
      WHERE
        recipient_id = $1
        AND is_read = FALSE
      `,
      [userId],
    );

    return result.rows[0].count;
  },
};

module.exports = message;
