import "dotenv/config";
import pg from "pg";

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
  application_name: "autohub-database-check",
});

async function checkDatabase() {
  const connection = await pool.query(`
    SELECT current_database() AS database_name,
           current_user AS database_user,
           NOW() AS checked_at
  `);

  console.log("Database connection: OK");
  console.table(connection.rows);

  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const tables = new Set(result.rows.map((row) => row.table_name));

  console.log(`Public tables found: ${tables.size}`);
  console.table(result.rows);

  const requiredTables = [
    "users",
    "categories",
    "products",
    "orders",
    "payments",
  ];

  const missing = requiredTables.filter((table) => !tables.has(table));

  if (missing.length > 0) {
    console.warn("Missing expected tables:", missing.join(", "));
  } else {
    console.log("Essential tables: OK");
  }

  if (tables.has("schema_migrations")) {
    const migrations = await pool.query(`
      SELECT filename, applied_at
      FROM public.schema_migrations
      ORDER BY filename
    `);

    console.log(`Tracked migrations: ${migrations.rowCount}`);
    console.table(migrations.rows);
  } else {
    console.warn(
      "No schema_migrations table. Migration history is not tracked.",
    );
  }

  if (tables.has("users")) {
    const admins = await pool.query(`
      SELECT email, role, is_active
      FROM public.users
      WHERE role::text = 'admin'
      ORDER BY email
    `);

    console.log(`Admin accounts found: ${admins.rowCount}`);
    console.table(admins.rows);
  }

  if (tables.has("categories")) {
    const categories = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM public.categories
    `);

    console.log("Category count:", categories.rows[0].total);
  }

  if (tables.has("products")) {
    const products = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM public.products
    `);

    console.log("Product count:", products.rows[0].total);
  }

  console.log("Database check completed.");
}

try {
  await checkDatabase();
} catch (error) {
  console.error("Database check failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
