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

  // filtered + sorted display list
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

  // grouped for category sections (only when viewing "全部")
  const sections = useMemo(() => {
    if (activeCategory || search) return null;
    const grouped = new Map<string, Resource[]>();
    for (const r of display) {
      const list = grouped.get(r.category) || [];
      list.push(r);
      grouped.set(r.category, list);
    }
    return Array.from(grouped.entries()).sort((a, b) => {
      const catA = cMap.get(a[0]);
      const catB = cMap.get(b[0]);
      return (catA?.sortWeight ?? 0) - (catB?.sortWeight ?? 0);
    });
  }, [display, activeCategory, search, cMap]);

  // featured = first resource (most recent after sort)
  const featured = display[0];

  // recent = last 4 by creation time
  const recent = useMemo(() => {
    return [...display].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
  }, [display]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16">
      {/* ====== Search ====== */}
      <div className="flex justify-center pt-8">
        <div className="relative w-full max-w-2xl">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--color-text-muted)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索资源..."
            className="w-full h-12 pl-12 pr-4 rounded-[var(--radius-xl)] border text-sm outline-none transition-all"
            style={{
              background: "var(--color-paper-2)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.boxShadow = "var(--shadow-glow)";
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "var(--color-paper-2)";
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* ====== Hero Banner ====== */}
      {featured && !search && !activeCategory && (
        <div
          className="relative rounded-[28px] overflow-hidden transition-all duration-[var(--dur-normal)]"
          style={{
            background: "linear-gradient(135deg, #F6F7FF 0%, #FBFAFF 100%)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 20px 60px rgba(79,124,255,0.08)",
            minHeight: "320px",
            padding: "48px",
          }}
        >
          {/* Radial glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-40%",
              right: "-10%",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(79,124,255,0.10) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 flex items-center h-full gap-8" style={{ minHeight: "224px" }}>
            {/* Left: text (60%) */}
            <div className="flex-1" style={{ maxWidth: "60%" }}>
              <span
                className="inline-block text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full mb-5"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                今日推荐
              </span>
              <h2
                className="tracking-tight mb-3"
                style={{
                  fontSize: "42px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {featured.name}
              </h2>
              {featured.description && (
                <p
                  className="mb-7 line-clamp-2"
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.6,
                    color: "var(--color-text-soft)",
                    maxWidth: "480px",
                  }}
                >
                  {stripHtml(featured.description)}
                </p>
              )}
              <div className="flex gap-3">
                <a
                  href={featured.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
                  style={{ background: "var(--color-accent)", color: "#fff" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  立即打开
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <Link
                  href={`/resource/${featured.id}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
                  style={{
                    background: "#fff",
                    color: "var(--color-text)",
                    border: "1.5px solid var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-accent)";
                    e.currentTarget.style.color = "var(--color-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.color = "var(--color-text)";
                  }}
                >
                  查看详情
                </Link>
              </div>
            </div>

            {/* Right: icon area (40%) */}
            <div className="hidden sm:flex shrink-0 items-center justify-center" style={{ width: "40%" }}>
              <div
                className="flex items-center justify-center select-none"
                style={{
                  width: "320px",
                  height: "200px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  fontSize: "80px",
                  border: "1px solid rgba(255,255,255,0.6)",
                }}
              >
                {cMap.get(featured.category)?.icon || "📦"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Single-category header ====== */}
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
            &larr; 全部分类
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {cMap.get(activeCategory)?.icon} {cMap.get(activeCategory)?.name}
          </span>
        </div>
      )}

      {/* ====== Search results ====== */}
      {search && (
        <div>
          <SectionHead title={`搜索结果 (${display.length})`} />
          {display.length > 0 ? (
            <CardGrid>
              {display.map((r) => (
                <ResourceRow key={r.id} resource={r} category={cMap.get(r.category)} />
              ))}
            </CardGrid>
          ) : (
            <Empty message="没有匹配的资源" hint="试试别的关键词" />
          )}
        </div>
      )}

      {/* ====== Recent updates ====== */}
      {recent.length > 0 && !search && !activeCategory && (
        <div>
          <SectionHead title="最近更新" />
          <CardGrid>
            {recent.map((r) => (
              <ResourceRow key={r.id} resource={r} category={cMap.get(r.category)} />
            ))}
          </CardGrid>
        </div>
      )}

      {/* ====== Category sections ====== */}
      {sections && sections.map(([catId, items]) => {
        const cat = cMap.get(catId);
        if (!cat || items.length === 0) return null;
        const shown = items.slice(0, 4);
        return (
          <div key={catId}>
            <SectionHead
              title={`${cat.icon} ${cat.name}`}
              count={items.length}
              viewAllHref={`/?cat=${cat.id}`}
              onViewAll={() => {
                setActiveCategory(cat.id);
                window.history.replaceState(null, "", `/?cat=${cat.id}`);
              }}
            />
            <CardGrid>
              {shown.map((r) => (
                <ResourceRow key={r.id} resource={r} category={cat} />
              ))}
            </CardGrid>
          </div>
        );
      })}

      {/* ====== Flat display for single-category ====== */}
      {activeCategory && !search && (
        <CardGrid>
          {display.map((r) => (
            <ResourceRow key={r.id} resource={r} category={cMap.get(r.category)} />
          ))}
        </CardGrid>
      )}

      {/* ====== Empty ====== */}
      {display.length === 0 && !search && (
        <Empty message="还没有资源" hint="登录后就可以添加啦" />
      )}
    </div>
  );
}

/* ---- Sub-components ---- */

function SectionHead({
  title,
  count,
  viewAllHref,
  onViewAll,
}: {
  title: string;
  count?: number;
  viewAllHref?: string;
  onViewAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold tracking-tight" style={{
        fontSize: "var(--text-lg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-display)",
      }}>
        {title}
        {count !== undefined && (
          <span className="ml-2 font-normal" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            {count}
          </span>
        )}
      </h2>
      {viewAllHref && onViewAll && count && count > 4 && (
        <button
          onClick={(e) => { e.preventDefault(); onViewAll(); }}
          className="text-xs font-medium transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          查看全部 &rarr;
        </button>
      )}
    </div>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}

/** Compact resource row - no tags, border only, shadow on hover */
function ResourceRow({ resource, category }: { resource: Resource; category?: Category }) {
  const date = new Date(resource.createdAt).toLocaleDateString("zh-CN", {
    month: "short", day: "numeric",
  });

  return (
    <Link
      href={`/resource/${resource.id}`}
      className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border transition-all duration-[var(--dur-fast)]"
      style={{
        background: "#fff",
        borderColor: "var(--color-border)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
        e.currentTarget.style.borderColor = "var(--color-border-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      {/* Icon */}
      <div className="shrink-0 w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-xl select-none"
        style={{ background: "var(--color-paper-2)" }}>
        {category?.icon || "📦"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate" style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text)",
          fontFamily: "var(--font-body)",
        }}>
          {resource.name}
        </h3>
        {resource.description ? (
          <p className="line-clamp-1 mt-0.5" style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
          }}>
            {stripHtml(resource.description)}
          </p>
        ) : (
          <p className="mt-0.5" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {date}
          </p>
        )}
      </div>

      {/* Arrow */}
      <svg className="shrink-0 w-4 h-4" style={{ color: "var(--color-text-muted)" }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function Empty({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--color-text-muted)" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: "var(--color-paper-2)" }}>
        <svg className="w-8 h-8" style={{ color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="font-medium" style={{ fontSize: "var(--text-base)", color: "var(--color-text-soft)" }}>
        {message}
      </p>
      <p className="mt-1" style={{ fontSize: "var(--text-sm)" }}>
        {hint}
      </p>
    </div>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").slice(0, 120);
}
