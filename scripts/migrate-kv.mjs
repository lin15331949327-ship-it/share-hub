// Copy data from Vercel KV (REST API) to local SQLite
// Run: KV_API=https://assured-tick-178582.upstash.io KV_TOKEN=gQA... node scripts/migrate-kv.mjs

const KV_API = process.env.KV_REST_API_URL || process.env.KV_API;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.KV_TOKEN;

if (!KV_API || !KV_TOKEN) { console.error("Missing KV_API/KV_TOKEN env vars"); process.exit(1); }

async function kvCmd(cmd, ...args) {
  const url = `${KV_API}/${cmd}/${args.join("/")}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  return res.json();
}

async function main() {
  const Database = (await import("better-sqlite3")).default;
  const path = await import("path");
  const db = new Database(path.default.join(process.cwd(), "sharehub.db"));
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (id TEXT PRIMARY KEY, name TEXT, subtitle TEXT DEFAULT '', description TEXT DEFAULT '', link TEXT DEFAULT '', category TEXT DEFAULT '', tags TEXT DEFAULT '[]', createdBy TEXT DEFAULT 'admin', createdAt INTEGER DEFAULT 0, displayOrder INTEGER DEFAULT 0, featured INTEGER DEFAULT 0, deletedAt INTEGER);
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT, icon TEXT DEFAULT '', "order" INTEGER DEFAULT 0, isCatchAll INTEGER DEFAULT 0, sortWeight INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS passwords (role TEXT PRIMARY KEY, hash TEXT NOT NULL DEFAULT '');
  `);

  // Resources
  const { result: ids } = await kvCmd("smembers", "resources:ids");
  console.log(`Resources: ${ids.length}`);
  let n = 0;
  for (const id of ids) {
    if (db.prepare("SELECT id FROM resources WHERE id=?").get(id)) continue;
    const { result: r } = await kvCmd("get", `resource:${id}`);
    if (!r) continue;
    try {
      const vals = [
        String(r.id||""), String(r.name||""), String(r.subtitle||""), String(r.description||""), String(r.link||""),
        String(r.category||""), JSON.stringify(r.tags||[]),
        String(r.createdBy||"admin"), Number(r.createdAt||0), Number(r.displayOrder||0), r.featured?1:0, r.deletedAt?Number(r.deletedAt):null
      ];
      db.prepare("INSERT INTO resources VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(...vals);
      n++;
    } catch(e) {
      console.error(`Error on resource ${id}:`, e.message);
    }
  }
  console.log(`Migrated ${n}`);

  // Categories
  const { result: cats } = await kvCmd("get", "categories");
  if (cats) {
    for (const c of cats) db.prepare("INSERT OR IGNORE INTO categories VALUES (?,?,?,?,?,?)").run(c.id,c.name,c.icon,c.order||0,c.isCatchAll?1:0,c.sortWeight||0);
    console.log(`Categories: ${cats.length}`);
  }

  // Passwords
  for (const role of ["admin","editor"]) {
    const { result: pw } = await kvCmd("get", `password:${role}`);
    if (pw) { db.prepare("INSERT OR REPLACE INTO passwords VALUES (?,?)").run(role, pw); console.log(`Migrated ${role} password`); }
  }

  console.log("Done!");
  process.exit(0);
}
main();
