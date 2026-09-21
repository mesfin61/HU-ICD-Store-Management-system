const pool = require("../config/db");

const department = {
  async findAll({ includeInactive = false } = {}) {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      FROM departments
      ${includeInactive ? "" : "WHERE is_active = true"}
      ORDER BY name ASC
      `,
    );

    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      FROM departments
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  async findByName(name) {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      FROM departments
      WHERE LOWER(name) = LOWER($1)
      `,
      [name],
    );

    return result.rows[0] || null;
  },

  async create({ name, description }) {
    const result = await pool.query(
      `
      INSERT INTO departments (
        name,
        description
      )
      VALUES ($1, $2)
      RETURNING
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `,
      [name, description || null],
    );

    return result.rows[0];
  },

  async update(id, { name, description }) {
    const result = await pool.query(
      `
      UPDATE departments
      SET
        name = $1,
        description = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `,
      [name, description || null, id],
    );

    return result.rows[0] || null;
  },

  async deactivate(id) {
    const result = await pool.query(
      `
      UPDATE departments
      SET
        is_active = false,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        description,
        is_active,
        updated_at
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  async activate(id) {
    const result = await pool.query(
      `
      UPDATE departments
      SET
        is_active = true,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        description,
        is_active,
        updated_at
      `,
      [id],
    );

    return result.rows[0] || null;
  },
};

module.exports = department;
