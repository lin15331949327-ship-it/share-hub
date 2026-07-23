import Database from "better-sqlite3";
import path from "path";
import type { Resource, Category } from "./types";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "sharehub.db");

let _db: Database.Database | null = null;

function db(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      subtitle TEXT DEFAULT '',
      description TEXT DEFAULT '',
      link TEXT DEFAULT '',
      category TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      createdBy TEXT DEFAULT 'admin',
      createdAt INTEGER DEFAULT 0,
      displayOrder INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      deletedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      icon TEXT DEFAULT '',
      "order" INTEGER DEFAULT 0,
      isCatchAll INTEGER DEFAULT 0,
      sortWeight INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS passwords (
      role TEXT PRIMARY KEY,
      hash TEXT NOT NULL DEFAULT ''
    );
  `);
}

function rowToResource(r: any): Resource {
  return {
    ...r,
    tags: JSON.parse(r.tags || "[]"),
    featured: !!r.featured,
    deletedAt: r.deletedAt || undefined,
  };
}

// ── Resources ──

export function getAllResources(): Resource[] {
  return db().prepare("SELECT * FROM resources").all().map(rowToResource);
}

export function getResource(id: string): Resource | null {
  const r = db().prepare("SELECT * FROM resources WHERE id = ?").get(id) as any;
  return r ? rowToResource(r) : null;
}

export function createResource(r: Resource): void {
  db().prepare(`INSERT INTO resources (id,name,subtitle,description,link,category,tags,createdBy,createdAt,displayOrder,featured,deletedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    r.id, r.name, r.subtitle || "", r.description || "", r.link || "",
    r.category, JSON.stringify(r.tags || []), r.createdBy, r.createdAt,
    r.displayOrder || 0, r.featured ? 1 : 0, r.deletedAt || null
  );
}

export function updateResource(r: Resource): void {
  db().prepare(`UPDATE resources SET name=?,subtitle=?,description=?,link=?,category=?,tags=?,createdBy=?,createdAt=?,displayOrder=?,featured=?,deletedAt=? WHERE id=?`).run(
    r.name, r.subtitle || "", r.description || "", r.link || "",
    r.category, JSON.stringify(r.tags || []), r.createdBy, r.createdAt,
    r.displayOrder || 0, r.featured ? 1 : 0, r.deletedAt || null, r.id
  );
}

export function deleteResource(id: string): void {
  db().prepare("DELETE FROM resources WHERE id = ?").run(id);
}

// ── Categories ──

export function getAllCategories(): Category[] {
  return db().prepare("SELECT * FROM categories ORDER BY sortWeight").all() as Category[];
}

export function setCategories(cats: Category[]): void {
  const d = db();
  d.exec("DELETE FROM categories");
  const insert = d.prepare("INSERT INTO categories (id,name,icon,\"order\",isCatchAll,sortWeight) VALUES (?,?,?,?,?,?)");
  const tx = d.transaction(() => {
    for (const c of cats) insert.run(c.id, c.name, c.icon, c.order || 0, c.isCatchAll ? 1 : 0, c.sortWeight || 0);
  });
  tx();
}

// ── Passwords ──

export function getAdminPassword(): string | null {
  const r = db().prepare("SELECT hash FROM passwords WHERE role = 'admin'").get() as any;
  return r?.hash || null;
}

export function setAdminPassword(hash: string): void {
  db().prepare("INSERT OR REPLACE INTO passwords (role, hash) VALUES ('admin', ?)").run(hash);
}

export function getEditorPassword(): string | null {
  const r = db().prepare("SELECT hash FROM passwords WHERE role = 'editor'").get() as any;
  return r?.hash || null;
}

export function setEditorPassword(hash: string): void {
  db().prepare("INSERT OR REPLACE INTO passwords (role, hash) VALUES ('editor', ?)").run(hash);
}
