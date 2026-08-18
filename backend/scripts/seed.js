const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const SUPER_ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD;

async function seed() {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    throw new Error(
      "SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD must be defined.",
    );
  }

  if (SUPER_ADMIN_PASSWORD.length < 8) {
    throw new Error(
      "SEED_SUPER_ADMIN_PASSWORD must be at least 8 characters.",
    );
  }

  const client = await pool.connect();

  try {
    console.log("🌱 Starting database seed...");

    await client.query("BEGIN");

    /*
     * ---------------------------------------------------------
     * 1. Seed roles
     * ---------------------------------------------------------
     */

    const roles = [
      {
        name: "Super Admin",
        description: "Full system access",
      },
      {
        name: "admin",
        description: "Administrative user",
      },
      {
        name: "user",
        description: "Standard system user",
      },
    ];

    for (const item of roles) {
      await client.query(
        `
        INSERT INTO roles (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name)
        DO UPDATE SET
          description = EXCLUDED.description
        `,
        [item.name, item.description],
      );
    }

    console.log("✔ Roles seeded.");

    /*
     * ---------------------------------------------------------
     * 2. Get Super Admin role
     * ---------------------------------------------------------
     */

    const roleResult = await client.query(
      `
      SELECT id
      FROM roles
      WHERE name = 'Super Admin'
      `,
    );

    if (roleResult.rows.length === 0) {
      throw new Error("Super Admin role was not created.");
    }

    const superAdminRoleId = roleResult.rows[0].id;

    /*
     * ---------------------------------------------------------
     * 3. Check whether bootstrap Super Admin exists
     * ---------------------------------------------------------
     */

    const existingAdmin = await client.query(
      `
      SELECT id, email
      FROM users
      WHERE email = $1
      `,
      [SUPER_ADMIN_EMAIL.trim().toLowerCase()],
    );

    /*
     * ---------------------------------------------------------
     * 4. Create Super Admin only if it doesn't exist
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * Running the seed again will NOT overwrite the
     * existing Super Admin's password.
     * ---------------------------------------------------------
     */

    if (existingAdmin.rows.length === 0) {
      const passwordHash = await bcrypt.hash(
        SUPER_ADMIN_PASSWORD,
        12,
      );

      await client.query(
        `
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role_id,
          is_active
        )
        VALUES ($1, $2, $3, $4, true)
        `,
        [
          "System Super Administrator",
          SUPER_ADMIN_EMAIL.trim().toLowerCase(),
          passwordHash,
          superAdminRoleId,
        ],
      );

      console.log("✔ Initial Super Admin created.");
    } else {
      console.log(
        "ℹ Super Admin already exists. Password was not changed.",
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Commit
     * ---------------------------------------------------------
     */

    await client.query("COMMIT");

    console.log("✅ Database seed completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ Database seed failed:");
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();