import { getAllCategories, setCategories, getAdminPassword, getEditorPassword, setAdminPassword, setEditorPassword } from "./kv";
import { hash } from "./hash";
import type { Category } from "./types";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "software", name: "软件工具", icon: "💿", order: 0 },
  { id: "websites", name: "网站收藏", icon: "🔗", order: 1 },
  { id: "membership", name: "共享会员", icon: "👑", order: 2 },
  { id: "tutorials", name: "教程资料", icon: "📚", order: 3 },
  { id: "games", name: "游戏相关", icon: "🎮", order: 4 },
  { id: "movies", name: "影视资源", icon: "🎬", order: 5 },
  { id: "music", name: "音乐音频", icon: "🎵", order: 6 },
  { id: "plugins", name: "插件模版", icon: "🧩", order: 7 },
  { id: "other", name: "其他", icon: "📦", order: 8 },
];

export async function seed() {
  // Seed categories if empty
  const existing = await getAllCategories();
  if (existing.length === 0) {
    await setCategories(DEFAULT_CATEGORIES);
    console.log("[seed] Seeded 9 categories");
  }

  // Seed admin password if not set
  const adminPw = await getAdminPassword();
  if (!adminPw && process.env.ADMIN_PASSWORD) {
    await setAdminPassword(await hash(process.env.ADMIN_PASSWORD));
    console.log("[seed] Seeded admin password");
  }

  // Seed editor password if not set
  const editorPw = await getEditorPassword();
  if (!editorPw && process.env.EDITOR_PASSWORD) {
    await setEditorPassword(await hash(process.env.EDITOR_PASSWORD));
    console.log("[seed] Seeded editor password");
  }
}
