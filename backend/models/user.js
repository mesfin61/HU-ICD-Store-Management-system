const pool = require("../config/db");

const user = {
  async findByEmail(email) {
    const result = await pool.query(
      `SELECT
         u.*,
         r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1`,
      [email],
    );

    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone_number,
        u.office_location,
        u.profile_picture,
        u.role_id,
        r.name AS role_name,
        u.department_id,
        d.name AS department_name,
        u.is_active,
        u.created_at,
        u.updated_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  },
 async findAll() {
    const result = await pool.query(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone_number,
        u.office_location,
        u.profile_picture,
        u.role_id,
        r.name AS role_name,
        u.department_id,
        d.name AS department_name,
        u.is_active,
        u.created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      ORDER BY u.created_at DESC`,
    );

    return result.rows;
  },
 async create({
    fullName,
    email,
    passwordHash,
    roleId,
    departmentId,
  }) {
    const result = await pool.query(
      `INSERT INTO users
        (
          full_name,
          email,
          password_hash,
          role_id,
          department_id
        )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        full_name,
        email,
        role_id,
        department_id,
        is_active,
        created_at`,
      [
        fullName,
        email,
        passwordHash,
        roleId,
        departmentId || null,
      ],
    );

    return result.rows[0];
  },

  async update(id, { fullName, email, roleId, departmentId, isActive }) {
    const result = await pool.query(
      `UPDATE users
       SET
         full_name = $1,
         email = $2,
         role_id = $3,
         department_id = $4,
         is_active = $5,
         updated_at = NOW()
       WHERE id = $6
       RETURNING
         id,
         full_name,
         email,
         role_id,
         department_id,
         is_active,
         updated_at`,
     [
  fullName,
  email,
  requestedRole.id,
  departmentId || null,
  isActive,
  id,
]
    );

    return result.rows[0] || null;
  },

  async updateWithSuperAdminGuard({
    id,
    actingUserId,
    fullName,
    email,
    roleId,
    departmentId,
    isActive,
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /*
      * Serialize every transaction that can change
      * Super Admin status.
      *
      * The number is simply a fixed application-wide
      * lock identifier. Every Super Admin transition
      * must use this same identifier.
      */
      await client.query(
        "SELECT pg_advisory_xact_lock($1)",
        [874231],
      );

      /*
      * Lock the target user so another transaction
      * cannot modify this same user simultaneously.
      */
      const targetResult = await client.query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.role_id,
          u.departmentId,
          u.is_active,
          r.name AS role_name
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = $1
        FOR UPDATE
        `,
        [id],
      );

      const targetUser = targetResult.rows[0];

      if (!targetUser) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "NOT_FOUND",
        };
      }

      /*
      * Lock all currently active Super Admins before
      * counting them.
      */
      const superAdminsResult = await client.query(
        `
        SELECT u.id
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE r.name = 'Super Admin'
          AND u.is_active = true
        FOR UPDATE
        `,
      );

      const activeSuperAdminCount =
        superAdminsResult.rows.length;

      /*
      * Validate requested role.
      */
      const requestedRoleResult = await client.query(
        `
        SELECT id, name
        FROM roles
        WHERE id = $1
        `,
        [roleId],
      );

      const requestedRole = requestedRoleResult.rows[0];

      if (!requestedRole) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "INVALID_ROLE",
        };
      }

      const targetIsSuperAdmin =
        targetUser.role_name === "Super Admin";

      /*
      * Would this operation remove the target's
      * Super Admin status?
      */
      const removingSuperAdminRole =
        targetIsSuperAdmin &&
        requestedRole.name !== "Super Admin";

      /*
      * Would this operation deactivate the target
      * while they are a Super Admin?
      */
      const deactivatingSuperAdmin =
        targetIsSuperAdmin &&
        isActive === false;

      /*
      * NEVER allow the system to reach zero active
      * Super Admins.
      */
      if (
        (removingSuperAdminRole ||
          deactivatingSuperAdmin) &&
        activeSuperAdminCount <= 1
      ) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "LAST_SUPER_ADMIN",
        };
      }

      /*
      * Prevent a user from changing their own
      * privileged role/status through this operation.
      */
      if (
        id === actingUserId &&
        (
          requestedRole.name !== targetUser.role_name ||
          isActive !== targetUser.is_active
        )
      ) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "SELF_PRIVILEGE_CHANGE",
        };
      }

      /*
      * Perform the actual update while all relevant
      * rows are protected by the transaction.
      */
      const updateResult = await client.query(
        `
        UPDATE users
        SET
          full_name = $1,
          email = $2,
          role_id = $3,
          is_active = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING
          id,
          full_name,
          email,
          role_id,
          is_active,
          updated_at
        `,
        [
          fullName,
          email,
          requestedRole.id,
          isActive,
          id,
        ],
      );

      await client.query("COMMIT");

      return {
        success: true,
        user: updateResult.rows[0],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async updateProfile(id, { fullName, email, phoneNumber, officeLocation }) {
    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
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

  async updateProfilePicture(id, profilePicture) {
    const result = await pool.query(
      `
      UPDATE users
      SET
        profile_picture = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, profile_picture
      `,
      [profilePicture, id],
    );

    return result.rows[0] || null;
  },

  async saveResetOtp(userId, otp, expiresAt) {
    const result = await pool.query(
      `
      UPDATE users
      SET
        reset_otp = $1,
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
      SELECT
        id,
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
      SET
        reset_otp = NULL,
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
      SET
        password_hash = $1,
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
      `UPDATE users
       SET
         is_active = false,
         updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_active`,
      [id],
    );

    return result.rows[0] || null;
  },

  async activate(id) {
    const result = await pool.query(
      `UPDATE users
       SET
         is_active = true,
         updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_active`,
      [id],
    );

    return result.rows[0] || null;
  },

  async countSuperAdmins() {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'Super Admin'
         AND u.is_active = true`,
    );

    return result.rows[0].count;
  },

  async delete(id) {
    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id`,
      [id],
    );
    

    return result.rows[0] || null;
  },

  async deactivateWithSuperAdminGuard({
  id,
  actingUserId,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * Serialize all Super Admin status changes.
     */
    await client.query(
      "SELECT pg_advisory_xact_lock($1)",
      [874231],
    );

    /*
     * Lock target user.
     */
    const targetResult = await client.query(
      `
      SELECT
        u.id,
        u.is_active,
        r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      FOR UPDATE
      `,
      [id],
    );

    const targetUser = targetResult.rows[0];

    if (!targetUser) {
      await client.query("ROLLBACK");

      return {
        success: false,
        reason: "NOT_FOUND",
      };
    }

    /*
     * Never allow self-deactivation.
     */
    if (id === actingUserId) {
      await client.query("ROLLBACK");

      return {
        success: false,
        reason: "SELF_DEACTIVATION",
      };
    }

    /*
     * If already inactive, nothing needs to happen.
     */
    if (!targetUser.is_active) {
      await client.query("ROLLBACK");

      return {
        success: false,
        reason: "ALREADY_INACTIVE",
      };
    }

    /*
     * Lock active Super Admin rows.
     */
    const superAdminsResult = await client.query(
      `
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name = 'Super Admin'
        AND u.is_active = true
      FOR UPDATE
      `,
    );

    const activeSuperAdminCount =
      superAdminsResult.rows.length;

    /*
     * Never deactivate the last Super Admin.
     */
    if (
      targetUser.role_name === "Super Admin" &&
      activeSuperAdminCount <= 1
    ) {
      await client.query("ROLLBACK");

      return {
        success: false,
        reason: "LAST_SUPER_ADMIN",
      };
    }

    const result = await client.query(
      `
      UPDATE users
      SET
        is_active = false,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, is_active
      `,
      [id],
    );

    await client.query("COMMIT");

    return {
      success: true,
      user: result.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
},
};

module.exports = user;