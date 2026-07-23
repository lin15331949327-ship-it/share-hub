// Auto-detect backend: SQLite if USE_SQLITE/DB_PATH is set, otherwise Vercel KV.
const isSQLite = !!(process.env.DB_PATH || process.env.USE_SQLITE);
const backend = isSQLite ? await import("./db") : await import("./kv-vercel");

export const {
  getAllResources, getResource, createResource, updateResource, deleteResource,
  getAllCategories, setCategories,
  getAdminPassword, setAdminPassword, getEditorPassword, setEditorPassword,
} = backend;
