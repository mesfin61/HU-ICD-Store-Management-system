const pool = require("../config/db");

const ADMINISTRATOR = "Administrator";

const user = {
  // =========================================================
  // AUTHENTICATION
  // =========================================================

  async findByEmail(email) {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.password_hash,
        u.phone_number,
        u.office_location,
        u.profile_picture,
        u.role_id,
        r.name AS role_name,
        u.department_id,
        d.name AS department_name,
        u.is_active,
        u.reset_otp,
        u.reset_otp_expires,
        u.created_at,
        u.updated_at
      FROM users u
      JOIN roles r
        ON r.id = u.role_id
      LEFT JOIN departments d
        ON d.id = u.department_id
      WHERE u.email = $1
      `,
      [email],
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

  // =========================================================
  // USER LOOKUP
  // =========================================================

  async findById(id) {
    const result = await pool.query(
      `
      SELECT
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
      JOIN roles r
        ON r.id = u.role_id
      LEFT JOIN departments d
        ON d.id = u.department_id
      WHERE u.id = $1
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  async findAll() {
    const result = await pool.query(
      `
      SELECT
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
      JOIN roles r
        ON r.id = u.role_id
      LEFT JOIN departments d
        ON d.id = u.department_id
      ORDER BY u.created_at DESC
      `,
    );

    return result.rows;
  },

  // =========================================================
  // CREATE USER
  // Administrator only
  // =========================================================

  async create({
    fullName,
    email,
    passwordHash,
    roleId,
    departmentId,
  }) {
    const result = await pool.query(
      `
      INSERT INTO users (
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
        created_at
      `,
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

  // =========================================================
  // ADMINISTRATOR USER MANAGEMENT
  // =========================================================
  //
  // This is the ONLY model method that should modify:
  //
  // - role_id
  // - department_id
  // - is_active
  //
  // Those are identity / authorization fields.
  //
  // The controller must already verify that the acting user
  // is an Administrator. The transaction below additionally
  // protects the system's Administrator invariant.
  // =========================================================

  async updateWithAdministratorGuard({
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
       * Serialize operations that can affect the number
       * of active Administrators.
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
          u.full_name,
          u.email,
          u.role_id,
          u.department_id,
          u.is_active,
          r.name AS role_name
        FROM users u
        JOIN roles r
          ON r.id = u.role_id
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
       * Administrator cannot modify their own
       * authorization state.
       */
      if (
        id === actingUserId &&
        (
          roleId !== targetUser.role_id ||
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
       * Validate requested role.
       */
      const roleResult = await client.query(
        `
        SELECT
          id,
          name
        FROM roles
        WHERE id = $1
        `,
        [roleId],
      );

      const requestedRole = roleResult.rows[0];

      if (!requestedRole) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "INVALID_ROLE",
        };
      }

      /*
       * Only the three application roles are allowed.
       */
      const allowedRoles = [
        "Administrator",
        "Store Manager",
        "Staff",
      ];

      if (!allowedRoles.includes(requestedRole.name)) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "INVALID_ROLE",
        };
      }

      /*
       * Department is required by the current user-management
       * workflow.
       */
      if (!departmentId) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "INVALID_DEPARTMENT",
        };
      }

      const departmentResult = await client.query(
        `
        SELECT
          id,
          name,
          is_active
        FROM departments
        WHERE id = $1
        `,
        [departmentId],
      );

      const requestedDepartment =
        departmentResult.rows[0];

      if (!requestedDepartment) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "INVALID_DEPARTMENT",
        };
      }

      if (!requestedDepartment.is_active) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "INACTIVE_DEPARTMENT",
        };
      }

      /*
       * Lock active Administrators.
       */
      const administratorsResult =
        await client.query(
          `
          SELECT u.id
          FROM users u
          JOIN roles r
            ON r.id = u.role_id
          WHERE r.name = $1
            AND u.is_active = TRUE
          FOR UPDATE
          `,
          [ADMINISTRATOR],
        );

      const activeAdministratorCount =
        administratorsResult.rows.length;

      const targetIsAdministrator =
        targetUser.role_name === ADMINISTRATOR;

      const removingAdministratorRole =
        targetIsAdministrator &&
        requestedRole.name !== ADMINISTRATOR;

      const deactivatingAdministrator =
        targetIsAdministrator &&
        isActive === false;

      /*
       * The system must NEVER reach a state with zero
       * active Administrators.
       */
      if (
        (
          removingAdministratorRole ||
          deactivatingAdministrator
        ) &&
        activeAdministratorCount <= 1
      ) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "LAST_ADMINISTRATOR",
        };
      }

      /*
       * Perform the complete identity update atomically.
       */
      const updateResult = await client.query(
        `
        UPDATE users
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
          created_at,
          updated_at
        `,
        [
          fullName,
          email,
          requestedRole.id,
          requestedDepartment.id,
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

  // =========================================================
  // PROFILE
  // =========================================================
  //
  // These fields are NOT authorization fields.
  //
  // Staff and Store Manager may update their own profile
  // through the profile controller.
  //
  // Administrator may also update their own profile.
  // =========================================================

  async updateProfile(
    id,
    {
      fullName,
      email,
      phoneNumber,
      officeLocation,
    },
  ) {
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
      [
        fullName,
        email,
        phoneNumber,
        officeLocation,
        id,
      ],
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
      RETURNING
        id,
        profile_picture
      `,
      [profilePicture, id],
    );

    return result.rows[0] || null;
  },

  // =========================================================
  // PASSWORD / RESET
  // =========================================================

  async saveResetOtp(userId, otp, expiresAt) {
    const result = await pool.query(
      `
      UPDATE users
      SET
        reset_otp = $1,
        reset_otp_expires = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING
        id,
        email,
        reset_otp,
        reset_otp_expires
      `,
      [otp, expiresAt, userId],
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
      RETURNING
        id,
        email
      `,
      [passwordHash, id],
    );

    return result.rows[0] || null;
  },

  // =========================================================
  // ADMINISTRATOR DEACTIVATION
  // =========================================================

  async deactivateWithAdministratorGuard({
    id,
    actingUserId,
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /*
       * Serialize Administrator status changes.
       */
      await client.query(
        "SELECT pg_advisory_xact_lock($1)",
        [874231],
      );

      /*
       * Lock target.
       */
      const targetResult = await client.query(
        `
        SELECT
          u.id,
          u.is_active,
          r.name AS role_name
        FROM users u
        JOIN roles r
          ON r.id = u.role_id
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
       * Never deactivate yourself.
       */
      if (id === actingUserId) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "SELF_DEACTIVATION",
        };
      }

      if (!targetUser.is_active) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "ALREADY_INACTIVE",
        };
      }

      /*
       * Lock active Administrators.
       */
      const administratorsResult =
        await client.query(
          `
          SELECT u.id
          FROM users u
          JOIN roles r
            ON r.id = u.role_id
          WHERE r.name = $1
            AND u.is_active = TRUE
          FOR UPDATE
          `,
          [ADMINISTRATOR],
        );

      const activeAdministratorCount =
        administratorsResult.rows.length;

      /*
       * Never deactivate the final Administrator.
       */
      if (
        targetUser.role_name === ADMINISTRATOR &&
        activeAdministratorCount <= 1
      ) {
        await client.query("ROLLBACK");

        return {
          success: false,
          reason: "LAST_ADMINISTRATOR",
        };
      }

      const result = await client.query(
        `
        UPDATE users
        SET
          is_active = FALSE,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          is_active
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