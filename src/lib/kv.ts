import { kv } from "@vercel/kv";
import type { Resource, Category } from "./types";

// --- Resources ---

export async function getAllResources(): Promise<Resource[]> {
  const ids = await kv.smembers("resources:ids");
  if (!ids.length) return [];
  const keys = ids.map((id) => `resource:${id}`);
  const items = await kv.mget<(Resource | null)[]>(...keys);
  return items.filter(Boolean) as Resource[];
}

export async function getResource(id: string): Promise<Resource | null> {
  return kv.get<Resource>(`resource:${id}`);
}

export async function createResource(r: Resource): Promise<void> {
  await kv.set(`resource:${r.id}`, r);
  await kv.sadd("resources:ids", r.id);
}

export async function updateResource(r: Resource): Promise<void> {
  await kv.set(`resource:${r.id}`, r);
}

export async function deleteResource(id: string): Promise<void> {
  await kv.del(`resource:${id}`);
  await kv.srem("resources:ids", id);
}

// --- Categories ---

export async function getAllCategories(): Promise<Category[]> {
  const cats = await kv.get<Category[]>("categories");
  return cats || [];
}

export async function setCategories(cats: Category[]): Promise<void> {
  await kv.set("categories", cats);
}

// --- Passwords ---

export async function getAdminPassword(): Promise<string | null> {
  return kv.get<string>("password:admin");
}

export async function setAdminPassword(hash: string): Promise<void> {
  await kv.set("password:admin", hash);
}

export async function getEditorPassword(): Promise<string | null> {
  return kv.get<string>("password:editor");
}

export async function setEditorPassword(hash: string): Promise<void> {
  await kv.set("password:editor", hash);
}
