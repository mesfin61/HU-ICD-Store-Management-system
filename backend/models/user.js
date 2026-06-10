const pool = require("../config/db");

const user = {
  async findByEmail(email) {
    const result = await pool.query(
      "SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = $1",
      [email],
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      "SELECT u.id, u.full_name, u.email, r.name AS role_name, u.is_active, u.created_at, u.updated_at FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1",
      [id],
    );
    return result.rows[0] || null;
  },

  async findAll() {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role_id, r.name AS role_name,
              u.is_active, u.created_at
       FROM users u
       JOIN roles r       ON r.id = u.role_id
       ORDER BY u.created_at DESC`,
    );
    return result.rows;
  },

  async create({ fullName, email, passwordHash, roleId }) {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role_id, is_active, created_at`,
      [fullName, email, passwordHash, roleId],
    );

    return result.rows[0];
  },

  async update(id, { fullName, email, roleId, isActive }) {
    const result = await pool.query(
      `UPDATE users
       SET full_name     = $1,
           email         = $2,
           role_id       = $3,
           is_active     = $4,
           updated_at    = NOW()
       WHERE id = $5
       RETURNING id, full_name, email, role_id, is_active, updated_at`,
      [fullName, email, roleId, isActive, id],
    );
    return result.rows[0] || null;
  },

  async deactivate(id) {
    const result = await pool.query(
      `UPDATE users SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING id, is_active`,
      [id],
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id],
    );
    return result.rows[0] || null;
  },
};

module.exports = user;
