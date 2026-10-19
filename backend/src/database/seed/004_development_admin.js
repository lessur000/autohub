require("dotenv").config();

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
});

async function seedDevelopmentAdmin() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development admin seed is disabled in production.");
  }

  const email = process.env.AUTOHUB_DEV_ADMIN_EMAIL?.trim().toLowerCase();

  const password = process.env.AUTOHUB_DEV_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set AUTOHUB_DEV_ADMIN_EMAIL and AUTOHUB_DEV_ADMIN_PASSWORD.",
    );
  }

  if (password.length < 12) {
    throw new Error(
      "Development admin password must be at least 12 characters.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `
      INSERT INTO users (
        email,
        password_hash,
        full_name,
        role,
        is_active
      )
      VALUES ($1, $2, $3, 'admin', TRUE)
      ON CONFLICT (email)
      DO NOTHING
      RETURNING id, email, role
    `,
    [email, passwordHash, "AutoHub Development Admin"],
  );

  if (result.rowCount === 0) {
    console.log("Admin email already exists. No changes were made.");
  } else {
    console.log("Development admin created:", result.rows[0]);
  }
}

seedDevelopmentAdmin()
  .catch((error) => {
    console.error("Development admin seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
