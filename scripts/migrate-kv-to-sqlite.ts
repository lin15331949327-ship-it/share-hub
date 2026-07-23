/**
 * One-time migration: copy all data from Vercel KV to local SQLite.
 * Run on server: npx tsx scripts/migrate-kv-to-sqlite.ts
 */

// Use Vercel KV SDK directly — ran via tsx, not part of Next.js build
// @ts-nocheck
const { kv } = await import("@vercel/kv");
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "sharehub.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Init schema
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

// ── Migrate resources ──
const ids = await kv.smembers("resources:ids");
console.log(`Found ${ids.length} resources`);
let n = 0;
for (const id of ids) {
  const r = await kv.get(`resource:${id}`);
  if (!r) continue;
  const exists = db.prepare("SELECT id FROM resources WHERE id = ?").get(id);
  if (exists) continue;
  db.prepare(`INSERT INTO resources VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    r.id, r.name, r.subtitle || "", r.description || "", r.link || "",
    r.category, JSON.stringify(r.tags || []), r.createdBy, r.createdAt,
    r.displayOrder || 0, r.featured ? 1 : 0, r.deletedAt || null
  );
  n++;
}
console.log(`Migrated ${n} resources`);

// ── Migrate categories ──
const cats = await kv.get<any[]>("categories");
if (cats) {
  const insert = db.prepare(`INSERT OR IGNORE INTO categories VALUES (?,?,?,?,?,?)`);
  for (const c of cats) insert.run(c.id, c.name, c.icon, c.order || 0, c.isCatchAll ? 1 : 0, c.sortWeight || 0);
  console.log(`Migrated ${cats.length} categories`);
}

// ── Migrate passwords ──
for (const role of ["admin", "editor"]) {
  const pw = await kv.get<string>(`password:${role}`);
  if (pw) {
    db.prepare("INSERT OR REPLACE INTO passwords VALUES (?, ?)").run(role, pw);
    console.log(`Migrated ${role} password`);
  }
}

console.log("Done!");
