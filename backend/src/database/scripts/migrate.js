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
  application_name: "autohub-migrations",
});

const MIGRATIONS_DIR = path.join(__dirname, "../migrations");

async function tableExists(client, tableName) {
  const result = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName],
  );

  return result.rows[0].exists;
}

async function migrate() {
  const usingDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

  if (
    !usingDatabaseUrl &&
    (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD)
  ) {
    throw new Error(
      "Set DATABASE_URL or provide DB_NAME, DB_USER, and DB_PASSWORD.",
    );
  }

  // Production migrations must be deliberately run from a trusted
  // deployment workflow, not accidentally during server startup.
  // Running this script manually is allowed only outside production mode.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Migration script is disabled when NODE_ENV=production. " +
        "Run migrations manually from a trusted environment with NODE_ENV=development.",
    );
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d+_.+\.sql$/i.test(file))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  if (files.length === 0) {
    throw new Error(`No migration files found in ${MIGRATIONS_DIR}`);
  }

  const client = await pool.connect();
  let lockAcquired = false;

  try {
    const connectionInfo = await client.query(`
      SELECT current_database() AS database_name,
             current_user AS database_user,
             inet_server_addr()::text AS server_address
    `);

    console.log("Connected database:");
    console.table(connectionInfo.rows);

    await client.query("SELECT pg_advisory_lock($1)", [741852963]);
    lockAcquired = true;

    const trackingTableExists = await tableExists(client, "schema_migrations");

    if (!trackingTableExists) {
      const existingTables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
      `);

      if (existingTables.rowCount > 0) {
        throw new Error(
          "Existing public tables found, but schema_migrations is missing. " +
            "Migration stopped to protect existing data. Verify migration history first.",
        );
      }

      await client.query(`
        CREATE TABLE public.schema_migrations (
          filename TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    }

    const appliedResult = await client.query(
      "SELECT filename FROM public.schema_migrations",
    );

    const applied = new Set(appliedResult.rows.map((row) => row.filename));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`SKIP ${file} (already applied)`);
        continue;
      }

      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, "utf8").trim();

      if (!sql) {
        throw new Error(`Migration file is empty: ${file}`);
      }

      console.log(`RUN ${file}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          "INSERT INTO public.schema_migrations (filename) VALUES ($1)",
          [file],
        );

        await client.query("COMMIT");
        console.log(`OK ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration failed: ${file}\n${error.message}`);
      }
    }

    console.log("Migration process completed.");
  } finally {
    try {
      if (lockAcquired) {
        await client.query("SELECT pg_advisory_unlock($1)", [741852963]);
      }
    } finally {
      client.release();
    }
  }
}

try {
  await migrate();
} catch (error) {
  console.error("Migration error:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
