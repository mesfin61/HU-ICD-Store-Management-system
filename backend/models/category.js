const pool = require("../config/db");

const category = {
  async findAll() {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        is_active
      FROM categories
      ORDER BY name ASC
      `,
    );

    return result.rows;
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
      FROM categories
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
      `,
      [name],
    );

    return result.rows[0] || null;
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
      FROM categories
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  async createCategory({ name, description }) {
    const result = await pool.query(
      `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name, description, is_active, created_at, updated_at`,
      [name, description],
    );

    return result.rows[0];
  },

  async updateCategory(id, { name, description }) {
    const result = await pool.query(
      `
      UPDATE categories
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

  async deactivateCategory(id) {
    const result = await pool.query(
      `
      UPDATE categories
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

  async activateCategory(id) {
    const result = await pool.query(
      `UPDATE categories SET is_active = true, updated_at = NOW() WHERE id =$1 RETURNING id, name, description, is_active,  updated_at`,
      [id],
    );

    return result.rows[0] || null;
  },
};

module.exports = category;
