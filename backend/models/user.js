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
      "SELECT u.id, u.full_name, u.email, u.phone_number, u.office_location, r.name AS role_name, u.is_active, u.created_at, u.updated_at FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1",
      [id],
    );
    return result.rows[0] || null;
  },

  async findAll() {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.office_location, u.role_id, r.name AS role_name,
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

  async updateProfile(id, { fullName, email, phoneNumber, officeLocation }) {
    const result = await pool.query(
      `
    UPDATE users
    SET full_name = $1,
        email = $2,
        phone_number = $3,
        office_location = $4,
        updated_at = NOW()
    WHERE id = $5
    RETURNING
      id,
      full_name,
      email,
      phone_number,
      office_location,
      updated_at
    `,
      [fullName, email, phoneNumber, officeLocation, id],
    );

    return result.rows[0] || null;
  },

  async saveResetOtp(userId, otp, expiresAt) {
    const result = await pool.query(
      `
      UPDATE users
      SET reset_otp = $1,
          reset_otp_expires = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, email, reset_otp, reset_otp_expires
      `,
      [otp, expiresAt, userId],
    );

    return result.rows[0] || null;
  },

  async findByEmailWithOtp(email) {
    const result = await pool.query(
      `
      SELECT id,
             full_name,
             email,
             password_hash,
             reset_otp,
             reset_otp_expires
      FROM users
      WHERE email = $1
      `,
      [email],
    );

    return result.rows[0] || null;
  },

  async clearResetOtp(userId) {
    const result = await pool.query(
      `
      UPDATE users
      SET reset_otp = NULL,
          reset_otp_expires = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
      `,
      [userId],
    );

    return result.rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    const result = await pool.query(
      `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, email
      `,
      [passwordHash, id],
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
