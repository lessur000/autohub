import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL?.trim()
  ? {
      connectionString: process.env.DATABASE_URL.trim(),
      ...(process.env.NODE_ENV === "production"
        ? { ssl: { rejectUnauthorized: true } }
        : {}),
    }
  : {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 2,
  connectionTimeoutMillis: 10000,
  application_name: "autohub-development-admin-seed",
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

  const connection = await pool.query(`
    SELECT current_database() AS database_name,
           current_user AS database_user
  `);

  console.log("Development admin seed target:");
  console.table(connection.rows);

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

try {
  await seedDevelopmentAdmin();
} catch (error) {
  console.error("Development admin seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
