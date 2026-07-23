// Data layer now backed by SQLite (local file) instead of Vercel KV.
// All public function signatures unchanged — drop-in replacement.
export {
  getAllResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getAllCategories,
  setCategories,
  getAdminPassword,
  setAdminPassword,
  getEditorPassword,
  setEditorPassword,
} from "./db";
