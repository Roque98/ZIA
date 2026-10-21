import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const TRACKING = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)`;

export async function migrate(pool, dir) {
  const sqlDir = dir || path.join(import.meta.dirname, "..", "sql");
  await pool.query(TRACKING);
  const files = (await readdir(sqlDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const applied = new Set(
    (await pool.query("SELECT id FROM schema_migrations")).rows.map((r) => r.id),
  );
  const ran = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(sqlDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
      await client.query("COMMIT");
      ran.push(file);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  return ran;
}
