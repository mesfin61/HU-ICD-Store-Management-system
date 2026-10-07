require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const ADMINISTRATOR_EMAIL =
  process.env.SEED_ADMINISTRATOR_EMAIL || process.env.ADMINISTRATOR_EMAIL;
const ADMINISTRATOR_PASSWORD =
  process.env.SEED_ADMINISTRATOR_PASSWORD || process.env.ADMINISTRATOR_PASSWORD;

async function seed() {
  if (!ADMINISTRATOR_EMAIL || !ADMINISTRATOR_PASSWORD) {
    throw new Error(
      "SEED_ADMINISTRATOR_EMAIL and SEED_ADMINISTRATOR_PASSWORD must be defined.",
    );
  }

  if (ADMINISTRATOR_PASSWORD.length < 8) {
    throw new Error("SEED_ADMINISTRATOR_PASSWORD must be at least 8 characters.");
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
        name: "Administrator",
        description: "System administration, user management, and audit access",
      },
      {
        name: "Directorate",
        description: "Business request review and approval access",
      },
      {
        name: "Store Manager",
        description: "Store inventory and item issuance management access",
      },
      {
        name: "Staff",
        description: "Standard staff request and inventory access",
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
     * 2. Migrate the retired Super Admin role and get Administrator role
     * ---------------------------------------------------------
     */

    await client.query(`
      UPDATE roles
      SET name = 'Administrator',
          description = 'System administration, user management, and audit access'
      WHERE name = 'Super Admin'
        AND NOT EXISTS (
          SELECT 1 FROM roles existing WHERE existing.name = 'Administrator'
        )
    `);

    await client.query(`
      UPDATE users
      SET role_id = (SELECT id FROM roles WHERE name = 'Administrator')
      WHERE role_id = (SELECT id FROM roles WHERE name = 'Super Admin')
    `);

    await client.query("DELETE FROM roles WHERE name = 'Super Admin'");

    const roleResult = await client.query(
      `
      SELECT id
      FROM roles
      WHERE name = 'Administrator'
      `,
    );

    if (roleResult.rows.length === 0) {
      throw new Error("Administrator role was not created.");
    }

    const administratorRoleId = roleResult.rows[0].id;

    /*
     * ---------------------------------------------------------
     * 3. Check whether bootstrap Administrator exists
     * ---------------------------------------------------------
     */

    const existingAdmin = await client.query(
      `
      SELECT id, email
      FROM users
      WHERE email = $1
      `,
      [ADMINISTRATOR_EMAIL.trim().toLowerCase()],
    );

    /*
     * ---------------------------------------------------------
     * 4. Create Administrator only if it doesn't exist
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * Running the seed again will NOT overwrite the
     * existing Administrator's password.
     * ---------------------------------------------------------
     */

    if (existingAdmin.rows.length === 0) {
      const passwordHash = await bcrypt.hash(ADMINISTRATOR_PASSWORD, 12);

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
          "System Administrator",
          ADMINISTRATOR_EMAIL.trim().toLowerCase(),
          passwordHash,
          administratorRoleId,
        ],
      );

      console.log("✔ Initial Administrator created.");
    } else {
      console.log("ℹ Administrator already exists. Password was not changed.");
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
