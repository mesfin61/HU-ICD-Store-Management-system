const pool = require("../config/db");

const request = {
  async create({ requesterId, departmentId, purpose, items }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const requestResult = await client.query(
        `
        INSERT INTO requests (
          requester_id,
          department_id,
          purpose
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          requester_id,
          department_id,
          status,
          purpose,
          requested_at
        `,
        [requesterId, departmentId, purpose],
      );

      const newRequest = requestResult.rows[0];

      for (const item of items) {
        await client.query(
          `
          INSERT INTO request_items (
            request_id,
            item_id,
            quantity_requested
          )
          VALUES ($1, $2, $3)
          `,
          [
            newRequest.id,
            item.itemId,
            item.quantity,
          ],
        );
      }

      await client.query("COMMIT");

      return newRequest;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async findById(id) {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.requester_id,
        r.department_id,
        r.status,
        r.purpose,
        r.requested_at,
        r.approved_by,
        r.approved_at,
        r.rejection_reason
      FROM requests r
      WHERE r.id = $1
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  async findItems(requestId) {
    const result = await pool.query(
      `
      SELECT
        ri.id,
        ri.request_id,
        ri.item_id,
        i.item_code,
        i.name AS item_name,
        ri.quantity_requested,
        ri.quantity_approved
      FROM request_items ri
      JOIN items i
        ON i.id = ri.item_id
      WHERE ri.request_id = $1
      ORDER BY i.name ASC
      `,
      [requestId],
    );

    return result.rows;
  },

  async findAll() {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.requester_id,
        u.full_name AS requester_name,
        r.department_id,
        d.name AS department_name,
        r.status,
        r.purpose,
        r.requested_at,
        r.approved_by,
        r.approved_at,
        r.rejection_reason
      FROM requests r
      JOIN users u
        ON u.id = r.requester_id
      JOIN departments d
        ON d.id = r.department_id
      ORDER BY r.requested_at DESC
      `,
    );

    return result.rows;
  },
};

module.exports = request;