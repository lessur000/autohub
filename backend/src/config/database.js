import pg from "pg";
import { env } from "./env.js";
import { logger } from "./logger.js";

const { Pool } = pg;

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ...(env.NODE_ENV === "production"
        ? { ssl: { rejectUnauthorized: true } }
        : {}),
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: false,
    };

export const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  application_name: "autohub-backend",
});

pool.on("error", (error) => {
  logger.error("Unexpected PostgreSQL pool error", {
    message: error.message,
  });
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function testDatabaseConnection() {
  const result = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      NOW() AS server_time
  `);

  return result.rows[0];
}

export async function closeDatabaseConnection() {
  await pool.end();
}
