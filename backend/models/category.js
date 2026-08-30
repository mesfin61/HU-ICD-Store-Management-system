const pool = require("../config/db");

const category = {
  async findAll() {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description
      FROM categories
      ORDER BY name ASC
      `,
    );

    return result.rows;
  },
};

module.exports = category;