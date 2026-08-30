const pool = require("../config/db");

/*
 * =========================================================
 * AUDIT LOG MODEL
 * =========================================================
 */

const auditLog = {
  // ========================================================
  // CREATE AUDIT RECORD
  // ========================================================

  async create({
    client,
    userId = null,
    action,
    entityName,
    entityId = null,
    oldData = null,
    newData = null,
  }) {
    if (!action) {
      throw new Error("AUDIT_ACTION_REQUIRED");
    }

    if (!entityName) {
      throw new Error("AUDIT_ENTITY_REQUIRED");
    }

    const db = client || pool;

    const result = await db.query(
      `
      INSERT INTO audit_logs (
        user_id,
        action,
        entity_name,
        entity_id,
        old_data,
        new_data
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5::jsonb,
        $6::jsonb
      )
      RETURNING
        id,
        user_id,
        action,
        entity_name,
        entity_id,
        old_data,
        new_data,
        created_at
      `,
      [
        userId,
        action,
        entityName,
        entityId,
        oldData
          ? JSON.stringify(oldData)
          : null,
        newData
          ? JSON.stringify(newData)
          : null,
      ],
    );

    return result.rows[0];
  },

  // ========================================================
  // GET ALL AUDIT LOGS
  //
  // ADMINISTRATOR ONLY
  // ========================================================

  async findAll({
    limit = 50,
    offset = 0,
    action = null,
    entityName = null,
    userId = null,
  } = {}) {
    const safeLimit = Math.min(
      Math.max(
        Number(limit) || 50,
        1,
      ),
      100,
    );

    const safeOffset = Math.max(
      Number(offset) || 0,
      0,
    );

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.user_id,
        u.full_name AS user_name,
        u.email AS user_email,

        a.action,
        a.entity_name,
        a.entity_id,

        a.old_data,
        a.new_data,

        a.created_at

      FROM audit_logs a

      LEFT JOIN users u
        ON u.id = a.user_id

      WHERE
        ($1::VARCHAR IS NULL OR a.action = $1)
        AND
        ($2::VARCHAR IS NULL OR a.entity_name = $2)
        AND
        ($3::UUID IS NULL OR a.user_id = $3)

      ORDER BY
        a.created_at DESC,
        a.id DESC

      LIMIT $4
      OFFSET $5
      `,
      [
        action,
        entityName,
        userId,
        safeLimit,
        safeOffset,
      ],
    );

    return result.rows;
  },

  // ========================================================
  // GET AUDIT HISTORY FOR CURRENT USER
  //
  // IMPORTANT:
  //
  // userId MUST come from the authenticated request.
  //
  // The browser must NOT supply the user ID.
  // ========================================================

  async findForUser({
    userId,
    limit = 50,
    offset = 0,
  } = {}) {
    if (!userId) {
      throw new Error(
        "USER_ID_REQUIRED",
      );
    }

    const safeLimit = Math.min(
      Math.max(
        Number(limit) || 50,
        1,
      ),
      100,
    );

    const safeOffset = Math.max(
      Number(offset) || 0,
      0,
    );

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.user_id,

        a.action,
        a.entity_name,
        a.entity_id,

        a.old_data,
        a.new_data,

        a.created_at

      FROM audit_logs a

      WHERE a.user_id = $1

      ORDER BY
        a.created_at DESC,
        a.id DESC

      LIMIT $2
      OFFSET $3
      `,
      [
        userId,
        safeLimit,
        safeOffset,
      ],
    );

    return result.rows;
  },

  // ========================================================
  // GET ONE AUDIT RECORD
  //
  // ADMINISTRATOR ONLY
  // ========================================================

  async findById(id) {
    const result = await pool.query(
      `
      SELECT
        a.id,
        a.user_id,
        u.full_name AS user_name,
        u.email AS user_email,

        a.action,
        a.entity_name,
        a.entity_id,

        a.old_data,
        a.new_data,

        a.created_at

      FROM audit_logs a

      LEFT JOIN users u
        ON u.id = a.user_id

      WHERE a.id = $1
      `,
      [id],
    );

    return (
      result.rows[0] || null
    );
  },
};

module.exports = auditLog;