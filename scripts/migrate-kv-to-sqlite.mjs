// @ts-nocheck
// One-time migration: copy data from Vercel KV to local SQLite
// Run: node --experimental-vm-modules scripts/migrate-kv-to-sqlite.mjs
import { createClient } from "@vercel/kv";

async function main() {
  const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const Database = (await import("better-sqlite3")).default;
  const path = await import("path");

  const DB_PATH = process.env.DB_PATH || path.default.join(process.cwd(), "sharehub.db");
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY, name TEXT, subtitle TEXT DEFAULT '', description TEXT DEFAULT '',
      link TEXT DEFAULT '', category TEXT DEFAULT '', tags TEXT DEFAULT '[]',
      createdBy TEXT DEFAULT 'admin', createdAt INTEGER DEFAULT 0,
      displayOrder INTEGER DEFAULT 0, featured INTEGER DEFAULT 0, deletedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name TEXT, icon TEXT DEFAULT '', "order" INTEGER DEFAULT 0,
      isCatchAll INTEGER DEFAULT 0, sortWeight INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS passwords (
      role TEXT PRIMARY KEY, hash TEXT NOT NULL DEFAULT ''
    );
  `);

  // Migrate resources
  const ids = await kv.smembers("resources:ids");
  console.log(`Found ${ids.length} resources`);
  let n = 0;
  for (const id of ids) {
    const r = await kv.get(`resource:${id}`);
    if (!r) continue;
    if (db.prepare("SELECT id FROM resources WHERE id = ?").get(id)) continue;
    db.prepare(`INSERT INTO resources VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      r.id, r.name, r.subtitle || "", r.description || "", r.link || "",
      r.category, JSON.stringify(r.tags || []), r.createdBy, r.createdAt,
      r.displayOrder || 0, r.featured ? 1 : 0, r.deletedAt || null
    );
    n++;
  }
  console.log(`Migrated ${n} resources`);

  // Migrate categories
  const cats = await kv.get("categories");
  if (cats) {
    const insert = db.prepare(`INSERT OR IGNORE INTO categories VALUES (?,?,?,?,?,?)`);
    for (const c of cats) insert.run(c.id, c.name, c.icon, c.order || 0, c.isCatchAll ? 1 : 0, c.sortWeight || 0);
    console.log(`Migrated ${cats.length} categories`);
  }

  // Migrate passwords
  for (const role of ["admin", "editor"]) {
    const pw = await kv.get(`password:${role}`);
    if (pw) {
      db.prepare("INSERT OR REPLACE INTO passwords VALUES (?, ?)").run(role, pw);
      console.log(`Migrated ${role} password`);
    }
  }

  console.log("Done!");
}

main();
