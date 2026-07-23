// Detect environment: SQLite (Alibaba ECS) if DB_PATH is set, otherwise Vercel KV.
// Both backends expose the same interface.

async function loadBackend() {
  if (process.env.DB_PATH || process.env.USE_SQLITE) {
    return await import("./db");
  }
  return await import("./kv-vercel");
}

const backend = await loadBackend();

export const getAllResources = backend.getAllResources;
export const getResource = backend.getResource;
export const createResource = backend.createResource;
export const updateResource = backend.updateResource;
export const deleteResource = backend.deleteResource;
export const getAllCategories = backend.getAllCategories;
export const setCategories = backend.setCategories;
export const getAdminPassword = backend.getAdminPassword;
export const setAdminPassword = backend.setAdminPassword;
export const getEditorPassword = backend.getEditorPassword;
export const setEditorPassword = backend.setEditorPassword;
