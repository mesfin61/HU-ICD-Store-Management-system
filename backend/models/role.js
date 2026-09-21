const pool = require("../config/db");

const role = {
  async findAll() {
    const result = await pool.query(
      "SELECT id, name, description FROM roles ORDER BY id ASC",
    );

    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      "SELECT id, name, description FROM roles WHERE id = $1",
      [id],
    );

    return result.rows[0] || null;
  },

  async findByName(name) {
    const result = await pool.query(
      "SELECT id, name, description FROM roles WHERE name = $1",
      [name],
    );

    return result.rows[0] || null;
  },
};

module.exports = role;
