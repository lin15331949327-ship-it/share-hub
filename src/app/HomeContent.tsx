"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { filterForDisplay, sortForDisplay, catMap } from "@/lib/resources";
import type { Resource, Category } from "@/lib/types";

function getInitialCategory(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("cat");
}

export default function HomeContent() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(getInitialCategory);

  useEffect(() => {
    Promise.all([
      fetch("/api/resources").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([res, cats]) => {
      setResources(res);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const cMap = catMap(categories);

  // filter out catch-all, then sort
  const display = useMemo(() => {
    let list = activeCategory
      ? resources.filter((r) => r.category === activeCategory)
      : filterForDisplay(resources, categories, null);
    list = sortForDisplay(list, categories);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [resources, categories, activeCategory, search]);

  // group by category for sectioned view (only when viewing "全部")
  const sections = useMemo(() => {
    if (activeCategory) return null; // single-category view: flat display
    const grouped = new Map<string, Resource[]>();
    for (const r of display) {
      const list = grouped.get(r.category) || [];
      list.push(r);
      grouped.set(r.category, list);
    }
    // sort groups by category sortWeight
    return Array.from(grouped.entries()).sort((a, b) => {
      const catA = cMap.get(a[0]);
      const catB = cMap.get(b[0]);
      return (catA?.sortWeight ?? 0) - (catB?.sortWeight ?? 0);
    });
  }, [display, activeCategory, cMap]);

  // featured = most recent resource (for hero)
  const featured = display[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--color-border)",
            borderTopColor: "var(--color-accent)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索资源..."
          className="w-full px-4 py-3 pl-11 rounded-[var(--radius-md)] border text-sm outline-none transition-all"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-accent-glow)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--color-text-muted)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded"
            style={{ color: "var(--color-text-muted)" }}
          >
            清除
          </button>
        )}
      </div>

      {/* Hero featured resource */}
      {featured && !search && !activeCategory && (
        <Link
          href={`/resource/${featured.id}`}
          className="block rounded-[var(--radius-lg)] border p-5 sm:p-6 transition-all duration-[var(--dur-normal)]"
          style={{
            background: "var(--color-accent-glow)",
            borderColor: "oklch(58% 0.16 65 / 25%)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 20px oklch(58% 0.16 65 / 15%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
              background: "var(--color-accent)", color: "#fff"
            }}>
              推荐
            </span>
            {cMap.get(featured.category) && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {cMap.get(featured.category)!.icon} {cMap.get(featured.category)!.name}
              </span>
            )}
          </div>
          <h2 className="font-semibold mb-1" style={{
            fontSize: "var(--text-lg)",
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
          }}>
            {featured.name}
          </h2>
          {featured.description && (
            <p className="line-clamp-1" style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-soft)",
            }}>
              {stripHtml(featured.description)}
            </p>
          )}
        </Link>
      )}

      {/* Category filter for single-category view */}
      {activeCategory && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveCategory(null);
              window.history.replaceState(null, "", "/");
            }}
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--color-text-soft)" }}
          >
            ← 全部分类
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {cMap.get(activeCategory)?.icon} {cMap.get(activeCategory)?.name}
          </span>
        </div>
      )}

      {/* Category sections (全部 view) */}
      {sections && sections.map(([catId, items]) => {
        const cat = cMap.get(catId);
        if (!cat || items.length === 0) return null;
        const maxShow = 4;
        const shown = items.slice(0, maxShow);
        return (
          <section key={catId}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold" style={{
                fontSize: "var(--text-base)",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
              }}>
                {cat.icon} {cat.name}
                <span className="ml-2 font-normal" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                  {items.length}
                </span>
              </h2>
              {items.length > maxShow && (
                <Link
                  href={`/?cat=${cat.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveCategory(cat.id);
                    window.history.replaceState(null, "", `/?cat=${cat.id}`);
                  }}
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  查看全部 →
                </Link>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {shown.map((r) => (
                <CompactCard key={r.id} resource={r} category={cMap.get(r.category)} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Flat list for search results or single-category view */}
      {!sections && display.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((r) => (
            <CompactCard key={r.id} resource={r} category={cMap.get(r.category)} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {display.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--color-text-muted)" }}>
          <p className="text-4xl mb-4 select-none">
            {search ? "🔍" : "📭"}
          </p>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-soft)", fontWeight: 500 }}>
            {search ? "没有匹配的资源" : "还没有资源"}
          </p>
          <p className="mt-1" style={{ fontSize: "var(--text-sm)" }}>
            {search ? "试试别的关键词" : "登录后就可以添加啦"}
          </p>
        </div>
      )}
    </div>
  );
}

/* Compact card - border only, shadow only on hover */
function CompactCard({ resource, category }: { resource: Resource; category?: Category }) {
  return (
    <Link
      href={`/resource/${resource.id}`}
      className="block p-4 rounded-[var(--radius-md)] border transition-all duration-[var(--dur-fast)]"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "oklch(58% 0.16 65 / 30%)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      <h3 className="font-medium truncate mb-0.5" style={{
        fontSize: "var(--text-sm)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      }}>
        {resource.name}
      </h3>
      {resource.description ? (
        <p className="line-clamp-1" style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
        }}>
          {stripHtml(resource.description)}
        </p>
      ) : (
        category && (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {category.icon} {category.name}
          </span>
        )
      )}
    </Link>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").slice(0, 120);
}
