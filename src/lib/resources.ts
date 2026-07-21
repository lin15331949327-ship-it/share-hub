import type { Resource, Category } from "./types";

/** Build a lookup map from category ID → Category */
export function catMap(categories: Category[]): Map<string, Category> {
  return new Map(categories.map((c) => [c.id, c]));
}

/**
 * Filter resources for the "全部" view:
 * - Exclude catch-all categories (isCatchAll)
 * - Exclude nothing when a specific category is selected
 */
export function filterForDisplay(
  resources: Resource[],
  categories: Category[],
  activeCategory: string | null
): Resource[] {
  if (activeCategory) {
    return resources.filter((r) => r.category === activeCategory);
  }
  const catchAllIds = new Set(
    categories.filter((c) => c.isCatchAll).map((c) => c.id)
  );
  if (catchAllIds.size === 0) return resources;
  return resources.filter((r) => !catchAllIds.has(r.category));
}

/**
 * Stable sort for display:
 * - Sort by category sortWeight (higher = later), then by createdAt descending
 * - Categories without sortWeight default to 0
 */
export function sortForDisplay(
  resources: Resource[],
  categories: Category[]
): Resource[] {
  const weight = new Map(categories.map((c) => [c.id, c.sortWeight ?? 0]));
  return [...resources].sort((a, b) => {
    const wA = weight.get(a.category) ?? 0;
    const wB = weight.get(b.category) ?? 0;
    if (wA !== wB) return wA - wB;
    // same weight — by displayOrder (drag order), then time
    const oA = a.displayOrder ?? a.createdAt;
    const oB = b.displayOrder ?? b.createdAt;
    if (oA !== oB) return oB - oA;
    return b.createdAt - a.createdAt;
  });
}
