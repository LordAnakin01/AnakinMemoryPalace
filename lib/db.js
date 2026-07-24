import { neon } from "@neondatabase/serverless";

const ROW_ID = "default";

// Lazy: constructed on first use, not at module load, so builds/route
// collection don't require DATABASE_URL to already be set.
let sql;
function db() {
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}

let ensured = false;

async function ensureTable() {
  if (ensured) return;
  await db()`
    CREATE TABLE IF NOT EXISTS palace_data (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  ensured = true;
}

export async function getPalaces() {
  await ensureTable();
  const rows = await db()`SELECT data FROM palace_data WHERE id = ${ROW_ID}`;
  return rows[0]?.data ?? [];
}

export async function savePalaces(palaces) {
  await ensureTable();
  await db()`
    INSERT INTO palace_data (id, data, updated_at)
    VALUES (${ROW_ID}, ${JSON.stringify(palaces)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
}
