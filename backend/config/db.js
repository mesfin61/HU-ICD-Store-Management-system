const { Pool } = require("pg");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || "hu_icd_store_management",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD ?? undefined,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Failed to connect to PostgreSQL:", err.message);
    process.exit(-1);
  }
  release();
  console.log("PostgreSQL connected successfully");
});

module.exports = pool;
