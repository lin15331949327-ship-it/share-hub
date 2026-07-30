import { describe, it, expect } from "vitest";
import { filterForDisplay, sortForDisplay, catMap } from "../resources";
import type { Resource, Category } from "../types";

const makeCat = (id: string, isCatchAll = false, sortWeight = 0): Category =>
  ({ id, name: id, icon: "📌", order: 0, isCatchAll, sortWeight });

const makeRes = (id: string, category: string, createdAt: number, displayOrder?: number): Resource =>
  ({ id, name: id, description: "", link: "", category, tags: [], createdBy: "admin", createdAt, displayOrder });

describe("catMap", () => {
  it("builds a Map from category id to Category", () => {
    const cats = [makeCat("tools"), makeCat("books")];
    const m = catMap(cats);
    expect(m.get("tools")!.name).toBe("tools");
    expect(m.get("books")!.name).toBe("books");
  });

  it("returns empty Map for empty input", () => {
    expect(catMap([]).size).toBe(0);
  });
});

describe("filterForDisplay", () => {
  it("filters out catch-all categories in 'all' view", () => {
    const cats = [makeCat("misc", true), makeCat("tools")];
    const resources = [makeRes("a", "misc", 1), makeRes("b", "tools", 2)];
    const result = filterForDisplay(resources, cats, null);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("filters by active category", () => {
    const cats = [makeCat("tools"), makeCat("books")];
    const resources = [makeRes("a", "tools", 1), makeRes("b", "books", 2)];
    const result = filterForDisplay(resources, cats, "tools");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("returns all when no catch-all and no filter", () => {
    const cats = [makeCat("tools"), makeCat("books")];
    const resources = [makeRes("a", "tools", 1), makeRes("b", "books", 2)];
    expect(filterForDisplay(resources, cats, null)).toHaveLength(2);
  });
});

describe("sortForDisplay", () => {
  it("sorts by sortWeight ascending, then by displayOrder descending", () => {
    const cats = [makeCat("tools", false, 10), makeCat("books", false, 0)];
    const resources = [
      makeRes("a", "tools", 100, 5),
      makeRes("b", "books", 200, 3),
      makeRes("c", "books", 300, 9),
    ];
    const sorted = sortForDisplay(resources, cats);
    // books (weight 0) before tools (weight 10); within books, higher displayOrder first
    expect(sorted.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("falls back to createdAt when displayOrder is missing", () => {
    const cats = [makeCat("tools")];
    const resources = [makeRes("old", "tools", 100), makeRes("new", "tools", 999)];
    const sorted = sortForDisplay(resources, cats);
    expect(sorted[0].id).toBe("new");
  });
});
