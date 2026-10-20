import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  application_name: "autohub-seed",
});

const SEEDS_DIR = path.join(__dirname, "../seed");

const SEED_FILES = [
  "001_categories.sql",
  "002_products.sql",
  "003_product_categories.sql",
];

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Seed script is disabled in production. " +
        "Review seed data and use a separate, explicitly approved production seeding process if needed.",
    );
  }

  if (
    !process.env.DATABASE_URL?.trim() &&
    (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD)
  ) {
    throw new Error(
      "Set DATABASE_URL or provide DB_NAME, DB_USER, and DB_PASSWORD.",
    );
  }

  if (!fs.existsSync(SEEDS_DIR)) {
    throw new Error(`Seeds directory not found: ${SEEDS_DIR}`);
  }

  const client = await pool.connect();

  try {
    const connection = await client.query(`
      SELECT current_database() AS database_name,
             current_user AS database_user
    `);

    console.log("Seed target:");
    console.table(connection.rows);

    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);

    const existing = new Set(tables.rows.map((row) => row.table_name));

    for (const required of ["categories", "products", "product_categories"]) {
      if (!existing.has(required)) {
        throw new Error(
          `Required table "${required}" is missing. Run and verify migrations first.`,
        );
      }
    }

    for (const file of SEED_FILES) {
      const fullPath = path.join(SEEDS_DIR, file);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`Seed file not found: ${fullPath}`);
      }

      const sql = fs.readFileSync(fullPath, "utf8").trim();

      if (!sql) {
        throw new Error(`Seed file is empty: ${file}`);
      }

      console.log(`SEED ${file}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`OK ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`${file} failed: ${error.message}`);
      }
    }

    console.log("SQL seed process completed.");
  } finally {
    client.release();
  }
}

try {
  await seed();
} catch (error) {
  console.error("Seed error:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
