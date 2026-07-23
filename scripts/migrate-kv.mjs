// Copy data from Vercel KV (REST API) to local SQLite
// Run: source .env.local && node scripts/migrate-kv.mjs

const KV_API = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
if (!KV_API || !KV_TOKEN) { console.error("Missing KV_REST_API_URL/KV_REST_API_TOKEN"); process.exit(1); }

async function kvGet(key) {
  const res = await fetch(`${KV_API}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const { result } = await res.json();
  // Upstash REST API returns JSON values as strings — parse them
  if (typeof result === "string") {
    try { return JSON.parse(result); } catch { return result; }
  }
  return result;
}

async function main() {
  const Database = (await import("better-sqlite3")).default;
  const path = await import("path");
  const db = new Database(path.default.join(process.cwd(), "sharehub.db"));
  db.pragma("journal_mode = WAL");

  // Fresh start — drop old data
  db.exec("DROP TABLE IF EXISTS resources");
  db.exec("DROP TABLE IF EXISTS categories");
  db.exec("DROP TABLE IF EXISTS passwords");
  db.exec(`
    CREATE TABLE resources (id TEXT PRIMARY KEY, name TEXT, subtitle TEXT DEFAULT '', description TEXT DEFAULT '', link TEXT DEFAULT '', category TEXT DEFAULT '', tags TEXT DEFAULT '[]', createdBy TEXT DEFAULT 'admin', createdAt INTEGER DEFAULT 0, displayOrder INTEGER DEFAULT 0, featured INTEGER DEFAULT 0, deletedAt INTEGER);
    CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT, icon TEXT DEFAULT '', "order" INTEGER DEFAULT 0, isCatchAll INTEGER DEFAULT 0, sortWeight INTEGER DEFAULT 0);
    CREATE TABLE passwords (role TEXT PRIMARY KEY, hash TEXT NOT NULL DEFAULT '');
  `);

  // ── Resources ──
  const idsRes = await fetch(`${KV_API}/smembers/resources:ids`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const { result: ids } = await idsRes.json();
  console.log(`Resources: ${ids.length}`);

  let n = 0;
  for (const id of ids) {
    const r = await kvGet(`resource:${id}`);
    if (!r || typeof r !== "object" || !r.name) continue;
    try {
      db.prepare("INSERT INTO resources VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(
        String(id), String(r.name), String(r.subtitle||""), String(r.description||""), String(r.link||""),
        String(r.category||""), typeof r.tags === "string" ? r.tags : JSON.stringify(r.tags||[]),
        String(r.createdBy||"admin"), Number(r.createdAt||0), Number(r.displayOrder||0),
        r.featured ? 1 : 0, r.deletedAt ? Number(r.deletedAt) : null
      );
      n++;
    } catch(e) { console.error(`ERR ${id}:`, e.message); }
  }
  console.log(`Migrated ${n} resources`);

  // ── Categories ──
  const cats = await kvGet("categories");
  if (Array.isArray(cats) && cats.length > 0) {
    const ins = db.prepare("INSERT INTO categories VALUES (?,?,?,?,?,?)");
    for (const c of cats) {
      ins.run(String(c.id), String(c.name), String(c.icon), Number(c.order||0), c.isCatchAll ? 1 : 0, Number(c.sortWeight||0));
    }
    console.log(`Migrated ${cats.length} categories`);
  }

  // ── Passwords ──
  for (const role of ["admin", "editor"]) {
    const pw = await kvGet(`password:${role}`);
    if (typeof pw === "string" && pw.length > 0) {
      db.prepare("INSERT OR REPLACE INTO passwords VALUES (?,?)").run(role, pw);
      console.log(`Migrated ${role} password`);
    }
  }

  console.log("Done!");
}
main();
