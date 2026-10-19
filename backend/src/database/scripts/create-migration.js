import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, "../migrations");

function createMigration() {
  const name = process.argv.slice(2).join("_").trim();

  if (!name) {
    throw new Error("Usage: pnpm db:create-migration add_vehicle_fields");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error("Use only letters, numbers, underscores, and hyphens.");
  }

  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d+_.+\.sql$/i.test(file));

  const highestNumber = files.reduce((max, file) => {
    const match = file.match(/^(\d+)_/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  const nextNumber = String(highestNumber + 1).padStart(3, "0");
  const safeName = name.toLowerCase().replace(/-/g, "_");
  const filename = `${nextNumber}_${safeName}.sql`;
  const fullPath = path.join(MIGRATIONS_DIR, filename);

  if (fs.existsSync(fullPath)) {
    throw new Error(`Migration already exists: ${filename}`);
  }

  const template = `-- Migration: ${filename}
-- Describe the schema change before writing SQL.

-- Example:
-- ALTER TABLE products ADD COLUMN example_column TEXT;
`;

  fs.writeFileSync(fullPath, template, {
    encoding: "utf8",
    flag: "wx",
  });

  console.log(`Created migration: ${fullPath}`);
  console.log("Review and edit the SQL before running migrations.");
}

try {
  createMigration();
} catch (error) {
  console.error("Create migration failed:", error.message);
  process.exitCode = 1;
}
